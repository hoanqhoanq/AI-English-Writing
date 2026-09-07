import dotenv from "dotenv";

dotenv.config();

export const config = {
    port: Number(process.env.PORT) || 5000,

    mongoUri: process.env.MONGODB_URI || "",

    jwtSecret:
        process.env.JWT_SECRET ||
        "ai_english_writing_jwt_secret_2026",

    // Short-lived access token used to call the API (sent as Bearer header).
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",

    // Long-lived refresh token secret/lifetime. The raw token is stored only in an
    // HttpOnly cookie; the server persists a hash of it in refresh_token_sessions.
    refreshTokenSecret:
        process.env.REFRESH_TOKEN_SECRET ||
        "ai_english_writing_refresh_token_secret_2026",
    refreshTokenExpiresInDays: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS) || 30,

    // Optional bootstrap for the very first admin account. If not set, no admin
    // account is auto-created — promote a user to admin manually via MongoDB or
    // an existing admin's user-management screen.
    adminBootstrapEmail: process.env.ADMIN_EMAIL || "",
    adminBootstrapPassword: process.env.ADMIN_PASSWORD || "",

    aiProvider: process.env.AI_PROVIDER || "gemini",

    geminiApiKey: process.env.GEMINI_API_KEY || "",

    geminiModel:
        process.env.GEMINI_MODEL || "gemini-3.6-flash",

    nodeEnv: process.env.NODE_ENV || "development",
};