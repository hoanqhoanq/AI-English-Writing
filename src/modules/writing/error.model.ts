import mongoose, { Document, Schema, Types } from "mongoose";
import { ErrorType } from "../../types";

export interface IWritingError extends Document {
    userId: Types.ObjectId | string;
    attemptId: Types.ObjectId | string;
    questionId: Types.ObjectId | string;
    type: ErrorType;
    category?: string;
    wrongText: string;
    correctText: string;
    explanation: string;
    topic: string;
    grammarTopic: string;
    createdAt: Date;
    updatedAt: Date;
}

const WritingErrorSchema = new Schema<IWritingError>(
    {
        userId: { type: Schema.Types.Mixed, required: true, index: true },
        attemptId: { type: Schema.Types.Mixed, required: true, index: true },
        questionId: { type: Schema.Types.Mixed, required: true, index: true },
        type: { type: String, required: true, index: true },
        category: { type: String, index: true },
        wrongText: { type: String, required: true },
        correctText: { type: String, required: true },
        explanation: { type: String, required: true },
        topic: { type: String, required: true, index: true },
        grammarTopic: { type: String, required: true, index: true },
    },
    { timestamps: true }
);

export const WritingErrorModel =
    mongoose.models.WritingError || mongoose.model<IWritingError>("WritingError", WritingErrorSchema);
