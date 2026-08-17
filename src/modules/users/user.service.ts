import mongoose from "mongoose";
import { UserModel } from "./user.model";
import { memoryStore } from "../../db/memoryStore";
import { hashPassword } from "../../utils/password";

export class UserService {
    private isMongoActive(): boolean {
        return mongoose.connection.readyState === 1;
    }

    async getProfile(userId: string) {
        if (this.isMongoActive()) {
            const user = await UserModel.findById(userId).select("-password");
            if (!user) throw new Error("Không tìm thấy người dùng");
            return user;
        } else {
            const user = memoryStore.users.find((u) => u._id === userId);
            if (!user) throw new Error("Không tìm thấy người dùng");
            const { password, ...safeUser } = user;
            return safeUser;
        }
    }

    async updateProfile(userId: string, updateData: any) {
        if (this.isMongoActive()) {
            const user = await UserModel.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select("-password");
            if (!user) throw new Error("Không tìm thấy người dùng");
            return user;
        } else {
            const index = memoryStore.users.findIndex((u) => u._id === userId);
            if (index === -1) throw new Error("Không tìm thấy người dùng");
            memoryStore.users[index] = {
                ...memoryStore.users[index],
                ...updateData,
                updatedAt: new Date(),
            };
            const { password, ...safeUser } = memoryStore.users[index];
            return safeUser;
        }
    }

    async getAllUsers() {
        if (this.isMongoActive()) {
            const users = await UserModel.find().select("-password").sort({ createdAt: -1 });
            return users;
        } else {
            return memoryStore.users.map((u) => {
                const attempts = memoryStore.attempts.filter((a) => a.userId === u._id);
                const avgScore = attempts.length
                    ? Math.round(attempts.reduce((sum, a) => sum + (a.finalScore || 0), 0) / attempts.length)
                    : 0;

                const { password, ...safe } = u;
                return {
                    ...safe,
                    totalAttempts: attempts.length,
                    averageScore: avgScore,
                };
            });
        }
    }

    async toggleUserStatus(userId: string) {
        if (this.isMongoActive()) {
            const user = await UserModel.findById(userId);
            if (!user) throw new Error("Không tìm thấy người dùng");
            user.isActive = !user.isActive;
            await user.save();
            const { password, ...safe } = user.toObject();
            return safe;
        } else {
            const index = memoryStore.users.findIndex((u) => u._id === userId);
            if (index === -1) throw new Error("Không tìm thấy người dùng");
            memoryStore.users[index].isActive = !memoryStore.users[index].isActive;
            memoryStore.users[index].updatedAt = new Date();
            const { password, ...safe } = memoryStore.users[index];
            return safe;
        }
    }

    async updateUser(userId: string, data: any) {
        if (this.isMongoActive()) {
            const user = await UserModel.findByIdAndUpdate(userId, { $set: data }, { new: true }).select("-password");
            if (!user) throw new Error("Không tìm thấy người dùng");
            return user;
        } else {
            const index = memoryStore.users.findIndex((u) => u._id === userId);
            if (index === -1) throw new Error("Không tìm thấy người dùng");
            memoryStore.users[index] = {
                ...memoryStore.users[index],
                ...data,
                updatedAt: new Date(),
            };
            const { password, ...safe } = memoryStore.users[index];
            return safe;
        }
    }

    async deleteUser(userId: string) {
        if (this.isMongoActive()) {
            const user = await UserModel.findByIdAndDelete(userId);
            if (!user) throw new Error("Không tìm thấy người dùng");
            return user;
        } else {
            const index = memoryStore.users.findIndex((u) => u._id === userId);
            if (index === -1) throw new Error("Không tìm thấy người dùng");
            const deleted = memoryStore.users.splice(index, 1)[0];
            const { password, ...safe } = deleted;
            return safe;
        }
    }

    async createUser(data: any) {
        const hashedPassword = await hashPassword(data.password || "Password123!");
        if (this.isMongoActive()) {
            const user = await UserModel.create({
                name: data.name,
                email: data.email.toLowerCase().trim(),
                password: hashedPassword,
                role: data.role || "user",
                level: data.level || "B1",
                target: data.target || "IELTS",
                dailyTarget: data.dailyTarget || 5,
                isActive: data.isActive !== undefined ? data.isActive : true,
            });
            const { password, ...safe } = user.toObject();
            return safe;
        } else {
            const newUser: any = {
                _id: "usr_" + Date.now(),
                name: data.name,
                email: data.email.toLowerCase().trim(),
                password: hashedPassword,
                role: data.role || "user",
                level: data.level || "B1",
                target: data.target || "IELTS",
                dailyGoal: data.dailyTarget || 5,
                streak: 1,
                totalWriting: 0,
                averageScore: 0,
                isActive: data.isActive !== undefined ? data.isActive : true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            memoryStore.users.push(newUser);
            const { password, ...safe } = newUser;
            return safe;
        }
    }
}

export const userService = new UserService();

