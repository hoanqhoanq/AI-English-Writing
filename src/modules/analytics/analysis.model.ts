import mongoose, { Document, Schema, Types } from "mongoose";
import { CefrLevel } from "../../types";

export interface IAIAnalysisDoc extends Document {
    userId: Types.ObjectId | string;
    overallLevel: CefrLevel;
    strengths: string[];
    weaknesses: string[];
    repeatedErrors: {
        type: string;
        category?: string;
        frequency: number;
        exampleMistake: string;
        correction: string;
        advice: string;
    }[];
    progress: "improving" | "stable" | "needs_attention";
    analysis: string;
    recommendations: string[];
    dataSnapshot: {
        totalAttempts: number;
        averageScore: number;
        totalErrors: number;
        errorTypesSummary: Record<string, number>;
        grammarSummary: Record<string, { total: number; errors: number; avgScore: number }>;
    };
    createdAt: Date;
    updatedAt: Date;
}

const AIAnalysisSchema = new Schema<IAIAnalysisDoc>(
    {
        userId: { type: Schema.Types.Mixed, required: true, index: true },
        overallLevel: { type: String, required: true },
        strengths: [{ type: String }],
        weaknesses: [{ type: String }],
        repeatedErrors: [
            {
                type: { type: String, required: true },
                category: { type: String },
                frequency: { type: Number, default: 1 },
                exampleMistake: { type: String },
                correction: { type: String },
                advice: { type: String },
            },
        ],
        progress: {
            type: String,
            enum: ["improving", "stable", "needs_attention"],
            default: "stable",
        },
        analysis: { type: String, required: true },
        recommendations: [{ type: String }],
        dataSnapshot: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

export const AIAnalysisModel =
    mongoose.models.AIAnalysis || mongoose.model<IAIAnalysisDoc>("AIAnalysis", AIAnalysisSchema);
