import mongoose, { Document, Schema, Types } from "mongoose";

export interface IRefreshTokenSession extends Document {
    userId: Types.ObjectId | string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
}

const RefreshTokenSessionSchema = new Schema<IRefreshTokenSession>(
    {
        userId: { type: Schema.Types.Mixed, required: true, index: true },
        tokenHash: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true, index: true },
        revokedAt: { type: Date },
        userAgent: { type: String },
    },
    { timestamps: true }
);

export const RefreshTokenSessionModel =
    mongoose.models.RefreshTokenSession ||
    mongoose.model<IRefreshTokenSession>("RefreshTokenSession", RefreshTokenSessionSchema, "refresh_token_sessions");
