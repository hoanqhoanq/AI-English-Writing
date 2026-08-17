import mongoose from "mongoose";
import { seedDatabase } from "../seeds/seeder";

export const connectDatabase = async (): Promise<void> => {
    try {
        mongoose.set("bufferCommands", false);
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            console.log("ℹ️ MONGODB_URI not provided. Operating with in-memory store & preloaded CEFR curriculum.");
            return;
        }

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 2000,
        });

        console.log("✅ MongoDB connected successfully");
        await seedDatabase();
    } catch (error: any) {
        const errorMsg = error?.message || String(error);
        if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("buffering timed out") || errorMsg.includes("Server selection timed out")) {
            console.log("ℹ️ No standalone MongoDB service on host. Seamlessly running with optimized In-Memory Data Store & seed questions.");
        } else {
            console.warn("MongoDB connection notice:", errorMsg);
        }
    }
};
