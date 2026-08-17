import { UserModel } from "../modules/users/user.model";
import { TopicModel } from "../modules/topics/topic.model";
import { GrammarTopicModel } from "../modules/topics/grammar.model";
import { WritingQuestionModel } from "../modules/writing/question.model";
import { hashPassword } from "../utils/password";
import { SEED_TOPICS, SEED_GRAMMAR, SEED_QUESTIONS, DEMO_ADMIN, DEMO_USER } from "./seedData";

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

        // 3. Seed Admin User
        const adminExists = await UserModel.findOne({ email: DEMO_ADMIN.email });
        let adminId: any = null;
        if (!adminExists) {
            console.log("[SEEDER] Creating default admin user (admin@example.com)...");
            const hashedPassword = await hashPassword(DEMO_ADMIN.password);
            const createdAdmin = await UserModel.create({
                ...DEMO_ADMIN,
                password: hashedPassword,
                isActive: true,
                dailyGoal: 10,
                streak: 5,
                totalWriting: 30,
                averageScore: 92,
            });
            adminId = createdAdmin._id;
        } else {
            adminId = adminExists._id;
        }

        // 4. Seed Regular Demo User
        const userExists = await UserModel.findOne({ email: DEMO_USER.email });
        if (!userExists) {
            console.log("[SEEDER] Creating default learner user (user@example.com)...");
            const hashedPassword = await hashPassword(DEMO_USER.password);
            await UserModel.create({
                ...DEMO_USER,
                password: hashedPassword,
                isActive: true,
                dailyGoal: 5,
                streak: 3,
                totalWriting: 12,
                averageScore: 78,
            });
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
