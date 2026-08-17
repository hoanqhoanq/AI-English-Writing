import mongoose, { Document, Schema, Types } from "mongoose";
import { CefrLevel, DifficultyLevel } from "../../types";

export interface IWritingQuestion extends Document {
    vietnameseSentence: string;
    referenceAnswer: string;
    alternativeAnswers: string[];
    level: CefrLevel;
    topic: string;
    grammarTopic: string;
    difficulty: DifficultyLevel;
    keywords: string[];
    isActive: boolean;
    createdBy?: Types.ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
}

const WritingQuestionSchema = new Schema<IWritingQuestion>(
    {
        vietnameseSentence: { type: String, required: true, trim: true },
        referenceAnswer: { type: String, required: true, trim: true },
        alternativeAnswers: [{ type: String, trim: true }],
        level: { type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"], required: true, index: true },
        topic: { type: String, required: true, index: true },
        grammarTopic: { type: String, required: true, index: true },
        difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium", index: true },
        keywords: [{ type: String }],
        isActive: { type: Boolean, default: true, index: true },
        createdBy: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

export const WritingQuestionModel =
    mongoose.models.WritingQuestion || mongoose.model<IWritingQuestion>("WritingQuestion", WritingQuestionSchema);
