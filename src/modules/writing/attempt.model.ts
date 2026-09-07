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
    summary?: string;
    correctAnswer?: string;
    alternativeAnswers: string[];
    errors: IErrorDetail[];
    strengths: string[];
    weaknesses: string[];
    overallFeedback: string;
    recommendations: string[];
    scoreBreakdown?: {
        grammar: number;
        vocabulary: number;
        meaning: number;
        sentenceStructure: number;
        naturalness: number;
    };
    aiProvider?: string;
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
        summary: { type: String },
        correctAnswer: { type: String },
        alternativeAnswers: [{ type: String }],
        errors: [
            {
                type: { type: String, required: true },
                category: { type: String },
                severity: { type: String, enum: ["minor", "major"], default: "minor" },
                wrongText: { type: String, required: true },
                correctText: { type: String, required: true },
                explanation: { type: String, required: true },
            },
        ],
        strengths: [{ type: String }],
        weaknesses: [{ type: String }],
        overallFeedback: { type: String, default: "" },
        recommendations: [{ type: String }],
        scoreBreakdown: {
            grammar: { type: Number },
            vocabulary: { type: Number },
            meaning: { type: Number },
            sentenceStructure: { type: Number },
            naturalness: { type: Number },
        },
        aiProvider: { type: String },
        level: { type: String, required: true, index: true },
        topic: { type: String, required: true, index: true },
        grammarTopic: { type: String, required: true, index: true },
    },
    { timestamps: true }
);

// History/Analytics/Weakness queries all filter by userId and sort by recency, or
// join on questionId — index the combinations actually used instead of relying on
// the single-field indexes above alone.
WritingAttemptSchema.index({ userId: 1, createdAt: -1 });
WritingAttemptSchema.index({ userId: 1, questionId: 1 });

export const WritingAttemptModel =
    mongoose.models.WritingAttempt || mongoose.model<IWritingAttempt>("WritingAttempt", WritingAttemptSchema);
