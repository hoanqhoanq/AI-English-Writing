import mongoose, { Document, Schema, Types } from "mongoose";
import { CefrLevel, DifficultyLevel, SessionStatus } from "../../types";

export interface IWritingSession extends Document {
    userId: Types.ObjectId | string;
    level: CefrLevel;
    topic?: string;
    grammarTopic?: string;
    difficulty?: DifficultyLevel;
    questions: (Types.ObjectId | string)[];
    currentQuestionIndex: number;
    totalQuestions: number;
    completedQuestions: number;
    scoreTotal: number;
    startedAt: Date;
    completedAt?: Date;
    status: SessionStatus;
    createdAt: Date;
    updatedAt: Date;
}

const WritingSessionSchema = new Schema<IWritingSession>(
    {
        userId: { type: Schema.Types.Mixed, required: true, index: true },
        level: { type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"], required: true },
        topic: { type: String },
        grammarTopic: { type: String },
        difficulty: { type: String, enum: ["easy", "medium", "hard"] },
        questions: [{ type: Schema.Types.Mixed, required: true }],
        currentQuestionIndex: { type: Number, default: 0 },
        totalQuestions: { type: Number, required: true },
        completedQuestions: { type: Number, default: 0 },
        scoreTotal: { type: Number, default: 0 },
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
        status: {
            type: String,
            enum: ["IN_PROGRESS", "COMPLETED", "ABANDONED"],
            default: "IN_PROGRESS",
            index: true,
        },
    },
    { timestamps: true }
);

export const WritingSessionModel =
    mongoose.models.WritingSession || mongoose.model<IWritingSession>("WritingSession", WritingSessionSchema);
