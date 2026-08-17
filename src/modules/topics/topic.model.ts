import mongoose, { Document, Schema } from "mongoose";

export interface ITopic extends Document {
    name: string;
    description: string;
    icon?: string;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const TopicSchema = new Schema<ITopic>(
    {
        name: { type: String, required: true, unique: true, trim: true, index: true },
        description: { type: String, default: "" },
        icon: { type: String, default: "BookOpen" },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const TopicModel = mongoose.models.Topic || mongoose.model<ITopic>("Topic", TopicSchema);
