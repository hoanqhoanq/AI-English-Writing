import mongoose, { Document, Schema } from "mongoose";

export interface IGrammarTopic extends Document {
    name: string;
    description: string;
    level: string;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const GrammarTopicSchema = new Schema<IGrammarTopic>(
    {
        name: { type: String, required: true, unique: true, trim: true, index: true },
        description: { type: String, default: "" },
        level: { type: String, default: "All" },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const GrammarTopicModel =
    mongoose.models.GrammarTopic || mongoose.model<IGrammarTopic>("GrammarTopic", GrammarTopicSchema);
