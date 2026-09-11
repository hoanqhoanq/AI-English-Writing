import mongoose, { Document, Schema, Types } from "mongoose";

export type ParagraphLevelTier = "Beginner" | "Intermediate" | "Advanced";

export interface IParagraphTopic extends Document {
    title: string;
    instruction: string;
    levelTier: ParagraphLevelTier;
    minWords: number;
    maxWords: number;
    requirements: string[];
    topicCategory?: string;
    isActive: boolean;
    order: number;
    createdBy?: Types.ObjectId | string;
    // Absent/undefined means an Admin-authored topic (the original, only source
    // before AI-generated Paragraph Writing) — no backfill needed on existing documents.
    source?: "admin_manual" | "ai_user_generated";
    createdAt: Date;
    updatedAt: Date;
}

const ParagraphTopicSchema = new Schema<IParagraphTopic>(
    {
        title: { type: String, required: true, trim: true },
        instruction: { type: String, required: true },
        levelTier: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], required: true, index: true },
        minWords: { type: Number, required: true },
        maxWords: { type: Number, required: true },
        requirements: [{ type: String }],
        topicCategory: { type: String },
        isActive: { type: Boolean, default: true, index: true },
        order: { type: Number, default: 0 },
        createdBy: { type: Schema.Types.Mixed },
        source: { type: String, enum: ["admin_manual", "ai_user_generated"] },
    },
    { timestamps: true }
);

ParagraphTopicSchema.index({ levelTier: 1, isActive: 1, order: 1 });

export const ParagraphTopicModel =
    mongoose.models.ParagraphTopic || mongoose.model<IParagraphTopic>("ParagraphTopic", ParagraphTopicSchema);
