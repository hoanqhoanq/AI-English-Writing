import mongoose, { Document, Schema, Types } from "mongoose";
import { AttemptStatus, IErrorDetail } from "../../types";

export interface IWritingAttempt extends Omit<Document, "errors"> {
    userId: Types.ObjectId | string;
    sessionId?: Types.ObjectId | string;
    questionId: Types.ObjectId | string;
    vietnameseSentence: string;
    referenceAnswer: string;
    userAnswer: string;
    status: AttemptStatus;
    aiScore: number;
    finalScore: number;
    errors: IErrorDetail[];
    strengths: string[];
    overallFeedback: string;
    recommendations: string[];
    level: string;
    topic: string;
    grammarTopic: string;
    createdAt: Date;
    updatedAt: Date;
}

const WritingAttemptSchema = new Schema<IWritingAttempt>(
    {
        userId: { type: Schema.Types.Mixed, required: true, index: true },
        sessionId: { type: Schema.Types.Mixed, index: true },
        questionId: { type: Schema.Types.Mixed, required: true, index: true },
        vietnameseSentence: { type: String, required: true },
        referenceAnswer: { type: String, required: true },
        userAnswer: { type: String, required: true },
        status: {
            type: String,
            enum: ["correct", "partially_correct", "incorrect"],
            required: true,
            index: true,
        },
        aiScore: { type: Number, required: true },
        finalScore: { type: Number, required: true, index: true },
        errors: [
            {
                type: { type: String, required: true },
                category: { type: String },
                wrongText: { type: String, required: true },
                correctText: { type: String, required: true },
                explanation: { type: String, required: true },
            },
        ],
        strengths: [{ type: String }],
        overallFeedback: { type: String, default: "" },
        recommendations: [{ type: String }],
        level: { type: String, required: true, index: true },
        topic: { type: String, required: true, index: true },
        grammarTopic: { type: String, required: true, index: true },
    },
    { timestamps: true }
);

export const WritingAttemptModel =
    mongoose.models.WritingAttempt || mongoose.model<IWritingAttempt>("WritingAttempt", WritingAttemptSchema);
