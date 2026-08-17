import dotenv from "dotenv";
dotenv.config();

export const config = {
    port: Number(process.env.PORT) || 3000,
    mongoUri: process.env.MONGODB_URI || "",
    jwtSecret: process.env.JWT_SECRET || "ai_english_writing_jwt_secret_dev_2025",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    aiProvider: process.env.AI_PROVIDER || "gemini",
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || "",
    nodeEnv: process.env.NODE_ENV || "development",
};
