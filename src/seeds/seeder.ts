import { UserModel } from "../modules/users/user.model";
import { TopicModel } from "../modules/topics/topic.model";
import { GrammarTopicModel } from "../modules/topics/grammar.model";
import { WritingQuestionModel } from "../modules/writing/question.model";
import { hashPassword } from "../utils/password";
import { SEED_TOPICS, SEED_GRAMMAR, SEED_QUESTIONS } from "./seedData";
import { config } from "../config/env";

export const seedDatabase = async (): Promise<void> => {
    try {
        console.log("[SEEDER] Checking database status for initial seed data...");

        // 1. Seed Topics
        const topicCount = await TopicModel.countDocuments();
        if (topicCount === 0) {
            console.log(`[SEEDER] Seeding ${SEED_TOPICS.length} topics...`);
            await TopicModel.insertMany(SEED_TOPICS);
        }

        // 2. Seed Grammar Topics
        const grammarCount = await GrammarTopicModel.countDocuments();
        if (grammarCount === 0) {
            console.log(`[SEEDER] Seeding ${SEED_GRAMMAR.length} grammar topics...`);
            await GrammarTopicModel.insertMany(SEED_GRAMMAR);
        }

        // 3. Bootstrap exactly one admin account, only if explicitly configured via
        // ADMIN_EMAIL/ADMIN_PASSWORD env vars. No public demo/mock accounts are
        // auto-created — real users must register through POST /api/auth/register.
        let adminId: any = null;
        const bootstrapEmail = config.adminBootstrapEmail?.toLowerCase().trim();
        if (bootstrapEmail && config.adminBootstrapPassword) {
            const adminExists = await UserModel.findOne({ email: bootstrapEmail });
            if (!adminExists) {
                console.log(`[SEEDER] Bootstrapping initial admin account (${bootstrapEmail}) from ADMIN_EMAIL/ADMIN_PASSWORD...`);
                const hashedPassword = await hashPassword(config.adminBootstrapPassword);
                const createdAdmin = await UserModel.create({
                    name: "Administrator",
                    email: bootstrapEmail,
                    password: hashedPassword,
                    role: "admin",
                    level: "C2",
                    target: "Academic English",
                    isActive: true,
                });
                adminId = createdAdmin._id;
            } else {
                adminId = adminExists._id;
            }
        } else {
            const anyAdmin = await UserModel.findOne({ role: "admin" });
            adminId = anyAdmin?._id || null;
        }

        // 5. Seed Writing Questions
        const questionCount = await WritingQuestionModel.countDocuments();
        if (questionCount < 100) {
            console.log(`[SEEDER] Seeding ${SEED_QUESTIONS.length} writing questions...`);
            const questionsWithCreator = SEED_QUESTIONS.map((q) => ({
                ...q,
                createdBy: adminId || "system",
                isActive: true,
            }));
            await WritingQuestionModel.insertMany(questionsWithCreator);
        }

        console.log("[SEEDER] Database seeding successfully verified.");
    } catch (error) {
        console.warn("[SEEDER] Notice: Database seeding skipped or running in fallback mode:", (error as any)?.message);
    }
};
