import mongoose, { Document, Schema } from "mongoose";
import { UserRole, CefrLevel, LearningTarget } from "../../types";

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    avatar?: string;
    level: CefrLevel;
    target: LearningTarget;
    dailyGoal: number; // questions per day
    streak: number;
    lastPracticeDate?: Date;
    totalWriting: number;
    averageScore: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        avatar: { type: String, default: "" },
        level: { type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"], default: "B1" },
        target: {
            type: String,
            enum: ["General English", "TOEIC", "IELTS", "Communication", "Academic English"],
            default: "General English",
        },
        dailyGoal: { type: Number, default: 5 },
        streak: { type: Number, default: 0 },
        lastPracticeDate: { type: Date },
        totalWriting: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
