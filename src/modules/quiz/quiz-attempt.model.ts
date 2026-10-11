import mongoose, { Document, Schema } from "mongoose";
import { CefrLevel } from "../../types";

export interface IQuizQuestion {
    questionId: string;
    question: string;
    options: string[];
    correctAnswer: number;
    selectedAnswer: number | null;
    isCorrect: boolean | null;
    explanation: string;
    tense: string;
    difficulty: CefrLevel;
    topic: string;
}

export type QuizAttemptStatus = "generated" | "completed";

export interface IQuizAttempt extends Document {
    userId: Schema.Types.Mixed;
    difficulty: CefrLevel;
    // Human-readable summary label (e.g. "Present Simple, Past Simple" or
    // "Tất cả 12 thì") — kept for backward compatibility with any existing
    // document/consumer that only knows about a single `grammar` string.
    grammar: string;
    // Canonical list of tense titles this attempt covers (e.g. ["Present
    // Simple", "Past Simple"]) — the source of truth for multi-tense quizzes.
    // Optional/defaulted so pre-existing documents (created before this field
    // existed) remain valid without a migration.
    tenses: string[];
    topic: string;
    questionCount: number;
    questions: IQuizQuestion[];
    correctCount: number;
    wrongCount: number;
    score: number;
    status: QuizAttemptStatus;
    startedAt: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
    {
        questionId: { type: String, required: true },
        question: { type: String, required: true },
        options: { type: [String], required: true },
        correctAnswer: { type: Number, required: true, min: 0, max: 3 },
        selectedAnswer: { type: Number, default: null, min: 0, max: 3 },
        isCorrect: { type: Boolean, default: null },
        explanation: { type: String, required: true },
        tense: { type: String, required: true },
        difficulty: { type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"], required: true },
        topic: { type: String, required: true },
    },
    { _id: false }
);

const QuizAttemptSchema = new Schema<IQuizAttempt>(
    {
        userId: { type: Schema.Types.Mixed, required: true, index: true },
        difficulty: { type: String, enum: ["A1", "A2", "B1", "B2", "C1", "C2"], required: true },
        grammar: { type: String, required: true },
        tenses: { type: [String], default: [] },
        topic: { type: String, required: true },
        questionCount: { type: Number, required: true },
        questions: [QuizQuestionSchema],
        correctCount: { type: Number, default: 0 },
        wrongCount: { type: Number, default: 0 },
        score: { type: Number, default: 0 },
        status: { type: String, enum: ["generated", "completed"], default: "generated", index: true },
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date },
    },
    { timestamps: true }
);

QuizAttemptSchema.index({ userId: 1, createdAt: -1 });

export const QuizAttemptModel =
    mongoose.models.QuizAttempt || mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);
