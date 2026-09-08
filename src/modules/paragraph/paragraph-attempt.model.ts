import mongoose, { Document, Schema, Types } from "mongoose";
import { IErrorDetail } from "../../types";

export interface IParagraphRevision {
    text: string;
    wordCount: number;
    score: number;
    criteria: {
        content: { score: number; feedback: string };
        organization: { score: number; feedback: string };
        coherence: { score: number; feedback: string };
        grammar: { score: number; feedback: string };
        vocabulary: { score: number; feedback: string };
        sentenceStructure: { score: number; feedback: string };
        naturalness: { score: number; feedback: string };
    };
    errors: IErrorDetail[];
    strengths: string[];
    weaknesses: string[];
    correctedSuggestion: string;
    overallFeedback: string;
    aiProvider?: string;
    submittedAt: Date;
}

export interface IParagraphAttempt extends Omit<Document, "errors"> {
    userId: Types.ObjectId | string;
    topicId: Types.ObjectId | string;
    currentUserAnswer: string;
    currentScore: number;
    revisions: IParagraphRevision[];
    createdAt: Date;
    updatedAt: Date;
}

const CriteriaScoreSchema = new Schema(
    {
        score: { type: Number, required: true },
        feedback: { type: String, required: true },
    },
    { _id: false }
);

const ParagraphRevisionSchema = new Schema<IParagraphRevision>(
    {
        text: { type: String, required: true },
        wordCount: { type: Number, required: true },
        score: { type: Number, required: true },
        criteria: {
            content: { type: CriteriaScoreSchema, required: true },
            organization: { type: CriteriaScoreSchema, required: true },
            coherence: { type: CriteriaScoreSchema, required: true },
            grammar: { type: CriteriaScoreSchema, required: true },
            vocabulary: { type: CriteriaScoreSchema, required: true },
            sentenceStructure: { type: CriteriaScoreSchema, required: true },
            naturalness: { type: CriteriaScoreSchema, required: true },
        },
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
        correctedSuggestion: { type: String, default: "" },
        overallFeedback: { type: String, default: "" },
        aiProvider: { type: String },
        submittedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const ParagraphAttemptSchema = new Schema<IParagraphAttempt>(
    {
        userId: { type: Schema.Types.Mixed, required: true, index: true },
        topicId: { type: Schema.Types.Mixed, required: true, index: true },
        currentUserAnswer: { type: String, default: "" },
        currentScore: { type: Number, default: 0 },
        revisions: [ParagraphRevisionSchema],
    },
    { timestamps: true }
);

ParagraphAttemptSchema.index({ userId: 1, topicId: 1 }, { unique: true });
ParagraphAttemptSchema.index({ userId: 1, updatedAt: -1 });

export const ParagraphAttemptModel =
    mongoose.models.ParagraphAttempt || mongoose.model<IParagraphAttempt>("ParagraphAttempt", ParagraphAttemptSchema);
