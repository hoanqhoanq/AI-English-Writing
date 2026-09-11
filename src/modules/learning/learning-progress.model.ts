import mongoose, { Document, Schema, Types } from "mongoose";

export type LearningSection = "learn" | "examples" | "practice" | "aiWriting";

export interface ILearningProgress extends Document {
    userId: Types.ObjectId | string;
    topicId: Types.ObjectId | string;
    completedSections: LearningSection[];
    lastAccessedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const LearningProgressSchema = new Schema<ILearningProgress>(
    {
        userId: { type: Schema.Types.Mixed, required: true, index: true },
        topicId: { type: Schema.Types.Mixed, required: true, index: true },
        completedSections: [{ type: String, enum: ["learn", "examples", "practice", "aiWriting"] }],
        lastAccessedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

LearningProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });

export const LearningProgressModel =
    mongoose.models.LearningProgress || mongoose.model<ILearningProgress>("LearningProgress", LearningProgressSchema);
