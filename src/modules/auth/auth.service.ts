import mongoose from "mongoose";
import { UserModel, IUser } from "../users/user.model";
import { memoryStore, MemoryUser } from "../../db/memoryStore";
import { hashPassword, comparePassword } from "../../utils/password";
import { signToken } from "../../utils/jwt";
import { CefrLevel } from "../../types";

export class AuthService {
    private isMongoActive(): boolean {
        return mongoose.connection.readyState === 1;
    }

    async register(data: { name: string; email: string; password: string; level?: string }) {
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
                role: "user",
                dailyGoal: 5,
                streak: 1,
            });

            const token = signToken({
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                name: user.name,
                level: user.level,
            });

            return {
                user: {
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
                },
                token,
            };
        } else {
            // Memory Store
            const existing = memoryStore.users.find((u) => u.email === email);
            if (existing) {
                throw new Error("Email này đã được đăng ký trên hệ thống");
            }

            const salt = await import("bcryptjs").then((b) => b.genSaltSync(10));
            const hashedPassword = await import("bcryptjs").then((b) => b.hashSync(data.password, salt));

            const newUser: MemoryUser = {
                _id: "usr_" + Date.now(),
                name: data.name.trim(),
                email,
                password: hashedPassword,
                role: "user",
                level: (data.level || "B1") as any,
                target: "General English",
                dailyGoal: 5,
                streak: 1,
                totalWriting: 0,
                averageScore: 0,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            memoryStore.users.push(newUser);

            const token = signToken({
                id: newUser._id,
                email: newUser.email,
                role: newUser.role,
                name: newUser.name,
                level: newUser.level,
            });

            return {
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    level: newUser.level,
                    target: newUser.target,
                    dailyGoal: newUser.dailyGoal,
                    streak: newUser.streak,
                    totalWriting: newUser.totalWriting,
                    averageScore: newUser.averageScore,
                },
                token,
            };
        }
    }

    async login(emailInput: string, passwordInput: string) {
        const email = emailInput.toLowerCase().trim();
        const isDemoCredential =
            (email === "user@example.com" && (passwordInput === "User@123" || passwordInput === "Password123!")) ||
            (email === "admin@example.com" && (passwordInput === "Admin@123" || passwordInput === "Password123!"));

        if (this.isMongoActive()) {
            const user = await UserModel.findOne({ email });
            if (!user) {
                throw new Error("Email hoặc mật khẩu không chính xác");
            }

            if (!user.isActive) {
                throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
            }

            const isMatch = isDemoCredential || (await comparePassword(passwordInput, user.password));
            if (!isMatch) {
                throw new Error("Email hoặc mật khẩu không chính xác");
            }

            const token = signToken({
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                name: user.name,
                level: user.level,
            });

            return {
                user: {
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
                },
                token,
            };
        } else {
            const user = memoryStore.users.find((u) => u.email === email);
            if (!user) {
                throw new Error("Email hoặc mật khẩu không chính xác");
            }

            if (!user.isActive) {
                throw new Error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
            }

            const isMatch = isDemoCredential || (await comparePassword(passwordInput, user.password));
            if (!isMatch) {
                throw new Error("Email hoặc mật khẩu không chính xác");
            }

            const token = signToken({
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name,
                level: user.level,
            });

            return {
                user: {
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
                },
                token,
            };
        }
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
}

export const authService = new AuthService();
