import mongoose from "mongoose";
import { UserModel } from "../users/user.model";
import { RefreshTokenSessionModel } from "./refreshToken.model";
import { memoryStore, MemoryUser, MemoryRefreshToken } from "../../db/memoryStore";
import { hashPassword, comparePassword } from "../../utils/password";
import { signToken, generateRefreshToken, hashRefreshToken } from "../../utils/jwt";
import { CefrLevel } from "../../types";
import { config } from "../../config/env";

interface SafeUser {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    level: string;
    target: string;
    dailyGoal: number;
    streak: number;
    totalWriting: number;
    averageScore: number;
}

interface AuthResult {
    user: SafeUser;
    accessToken: string;
    refreshToken: string;
}

export class AuthService {
    private isMongoActive(): boolean {
        return mongoose.connection.readyState === 1;
    }

    private refreshTokenExpiry(): Date {
        return new Date(Date.now() + config.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000);
    }

    private async issueTokens(user: SafeUser, userAgent?: string): Promise<{ accessToken: string; refreshToken: string }> {
        const accessToken = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            level: user.level,
        });

        const refreshToken = generateRefreshToken();
        const tokenHash = hashRefreshToken(refreshToken);
        const expiresAt = this.refreshTokenExpiry();

        if (this.isMongoActive()) {
            await RefreshTokenSessionModel.create({ userId: user.id, tokenHash, expiresAt, userAgent });
        } else {
            const session: MemoryRefreshToken = {
                _id: "rt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
                userId: user.id,
                tokenHash,
                expiresAt,
                userAgent,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            memoryStore.refreshTokens.push(session);
        }

        return { accessToken, refreshToken };
    }

    private async revokeRefreshToken(rawRefreshToken: string): Promise<void> {
        const tokenHash = hashRefreshToken(rawRefreshToken);
        if (this.isMongoActive()) {
            await RefreshTokenSessionModel.updateOne({ tokenHash, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
        } else {
            const session = memoryStore.refreshTokens.find((s) => s.tokenHash === tokenHash && !s.revokedAt);
            if (session) {
                session.revokedAt = new Date();
                session.updatedAt = new Date();
            }
        }
    }

    async register(data: { name: string; email: string; password: string; level?: string; target?: string }, userAgent?: string): Promise<AuthResult> {
        const email = data.email.toLowerCase().trim();

        if (this.isMongoActive()) {
            const existing = await UserModel.findOne({ email });
            if (existing) {
                throw new Error("Email này đã được đăng ký trên hệ thống");
            }

            const hashedPassword = await hashPassword(data.password);
            const user = await UserModel.create({
                name: data.name.trim(),
                email,
                password: hashedPassword,
                level: (data.level || "B1") as CefrLevel,
                target: data.target || "General English",
                role: "user",
                dailyGoal: 5,
                streak: 0,
            });

            const safeUser = this.mapMongoUser(user);
            const tokens = await this.issueTokens(safeUser, userAgent);
            return { user: safeUser, ...tokens };
        } else {
            const existing = memoryStore.users.find((u) => u.email === email);
            if (existing) {
                throw new Error("Email này đã được đăng ký trên hệ thống");
            }

            const hashedPassword = await hashPassword(data.password);
            const newUser: MemoryUser = {
                _id: "usr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
                name: data.name.trim(),
                email,
                password: hashedPassword,
                role: "user",
                level: (data.level || "B1") as any,
                target: (data.target || "General English") as any,
                dailyGoal: 5,
                streak: 0,
                totalWriting: 0,
                averageScore: 0,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            memoryStore.users.push(newUser);

            const safeUser = this.mapMemoryUser(newUser);
            const tokens = await this.issueTokens(safeUser, userAgent);
            return { user: safeUser, ...tokens };
        }
    }

    async login(emailInput: string, passwordInput: string, userAgent?: string): Promise<AuthResult> {
        const email = emailInput.toLowerCase().trim();

        if (this.isMongoActive()) {
            const user = await UserModel.findOne({ email });
            if (!user || !user.password) {
                throw new Error("Email hoặc mật khẩu không chính xác");
            }

            if (!user.isActive) {
                throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
            }

            const isMatch = await comparePassword(passwordInput, user.password);
            if (!isMatch) {
                throw new Error("Email hoặc mật khẩu không chính xác");
            }

            const safeUser = this.mapMongoUser(user);
            const tokens = await this.issueTokens(safeUser, userAgent);
            return { user: safeUser, ...tokens };
        } else {
            const user = memoryStore.users.find((u) => u.email === email);
            if (!user) {
                throw new Error("Email hoặc mật khẩu không chính xác");
            }

            if (!user.isActive) {
                throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
            }

            const isMatch = await comparePassword(passwordInput, user.password);
            if (!isMatch) {
                throw new Error("Email hoặc mật khẩu không chính xác");
            }

            const safeUser = this.mapMemoryUser(user);
            const tokens = await this.issueTokens(safeUser, userAgent);
            return { user: safeUser, ...tokens };
        }
    }

    /**
     * Rotates a refresh token: validates it against refresh_token_sessions, revokes it,
     * and issues a brand new access + refresh token pair. Throws if the token is missing,
     * unknown, expired, already revoked, or its owning user no longer exists/active.
     */
    async refresh(rawRefreshToken: string | undefined, userAgent?: string): Promise<AuthResult> {
        if (!rawRefreshToken) {
            throw new Error("Không tìm thấy phiên đăng nhập");
        }

        const tokenHash = hashRefreshToken(rawRefreshToken);
        const now = new Date();

        if (this.isMongoActive()) {
            const session = await RefreshTokenSessionModel.findOne({ tokenHash });
            if (!session || session.revokedAt || session.expiresAt < now) {
                throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
            }

            const user = await UserModel.findById(session.userId);
            if (!user || !user.isActive) {
                throw new Error("Tài khoản không tồn tại hoặc đã bị khóa");
            }

            session.revokedAt = now;
            await session.save();

            const safeUser = this.mapMongoUser(user);
            const tokens = await this.issueTokens(safeUser, userAgent);
            return { user: safeUser, ...tokens };
        } else {
            const session = memoryStore.refreshTokens.find((s) => s.tokenHash === tokenHash);
            if (!session || session.revokedAt || session.expiresAt < now) {
                throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
            }

            const user = memoryStore.users.find((u) => u._id === session.userId);
            if (!user || !user.isActive) {
                throw new Error("Tài khoản không tồn tại hoặc đã bị khóa");
            }

            session.revokedAt = now;
            session.updatedAt = now;

            const safeUser = this.mapMemoryUser(user);
            const tokens = await this.issueTokens(safeUser, userAgent);
            return { user: safeUser, ...tokens };
        }
    }

    async logout(rawRefreshToken?: string): Promise<void> {
        if (!rawRefreshToken) return;
        await this.revokeRefreshToken(rawRefreshToken);
    }

    async getMe(userId: string) {
        if (this.isMongoActive()) {
            const user = await UserModel.findById(userId).select("-password");
            if (!user) throw new Error("Không tìm thấy người dùng");
            return {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                level: user.level,
                target: user.target,
                dailyGoal: user.dailyGoal,
                streak: user.streak,
                totalWriting: user.totalWriting,
                averageScore: user.averageScore,
                createdAt: user.createdAt,
            };
        } else {
            const user = memoryStore.users.find((u) => u._id === userId);
            if (!user) throw new Error("Không tìm thấy người dùng");
            return {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                level: user.level,
                target: user.target,
                dailyGoal: user.dailyGoal,
                streak: user.streak,
                totalWriting: user.totalWriting,
                averageScore: user.averageScore,
                createdAt: user.createdAt,
            };
        }
    }

    private mapMongoUser(user: any): SafeUser {
        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            level: user.level,
            target: user.target,
            dailyGoal: user.dailyGoal,
            streak: user.streak,
            totalWriting: user.totalWriting,
            averageScore: user.averageScore,
        };
    }

    private mapMemoryUser(user: MemoryUser): SafeUser {
        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            level: user.level,
            target: user.target,
            dailyGoal: user.dailyGoal,
            streak: user.streak,
            totalWriting: user.totalWriting,
            averageScore: user.averageScore,
        };
    }
}

export const authService = new AuthService();
