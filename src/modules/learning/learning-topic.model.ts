import mongoose, { Document, Schema, Types } from "mongoose";
import { CefrLevel, DifficultyLevel } from "../../types";

export type LearningCategory = "grammar" | "writing_skill";

export interface ILearningExample {
    english: string;
    vietnamese?: string;
    explanation: string;
}

export interface ILearningMistake {
    wrong: string;
    correct: string;
    explanation: string;
}

export interface ILearningTopic extends Document {
    slug: string;
    title: string;
    titleVi: string;
    category: LearningCategory;
    description: string;
    theory: string;
    examples: ILearningExample[];
    commonMistakes: ILearningMistake[];
    practiceTag?: string;
    externalPracticePath?: string;
    cefrLevel?: CefrLevel;
    difficulty?: DifficultyLevel;
    order: number;
    isPublished: boolean;
    createdBy?: Types.ObjectId | string;
    createdAt: Date;
    updatedAt: Date;
}

const LearningExampleSchema = new Schema<ILearningExample>(
    {
        english: { type: String, required: true },
        vietnamese: { type: String },
        explanation: { type: String, required: true },
    },
    { _id: false }
);

const LearningMistakeSchema = new Schema<ILearningMistake>(
    {
        wrong: { type: String, required: true },
        correct: { type: String, required: true },
        explanation: { type: String, required: true },
    },
    { _id: false }
);

const LearningTopicSchema = new Schema<ILearningTopic>(
    {
        slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
        title: { type: String, required: true, trim: true },
        titleVi: { type: String, required: true, trim: true },
        category: { type: String, enum: ["grammar", "writing_skill"], required: true },
        description: { type: String, default: "" },
        theory: { type: String, default: "" },
        examples: [LearningExampleSchema],
        commonMistakes: [LearningMistakeSchema],
        practiceTag: { type: String },
        externalPracticePath: { type: String },
        cefrLevel: { type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
        difficulty: { type: String, enum: ["easy", "medium", "hard"] },
        order: { type: Number, default: 0 },
        isPublished: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

LearningTopicSchema.index({ category: 1, isPublished: 1, order: 1 });

export const LearningTopicModel =
    mongoose.models.LearningTopic || mongoose.model<ILearningTopic>("LearningTopic", LearningTopicSchema);
