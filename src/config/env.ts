import dotenv from "dotenv";

dotenv.config();

export const config = {
    port: Number(process.env.PORT) || 5000,

    mongoUri: process.env.MONGODB_URI || "",

    jwtSecret:
        process.env.JWT_SECRET ||
        "ai_english_writing_jwt_secret_2026",

    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",

    aiProvider: process.env.AI_PROVIDER || "gemini",

    geminiApiKey: process.env.GEMINI_API_KEY || "",

    geminiModel:
        process.env.GEMINI_MODEL || "gemini-2.5-flash",

    nodeEnv: process.env.NODE_ENV || "development",
};