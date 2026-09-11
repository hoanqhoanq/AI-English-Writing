import mongoose from "mongoose";
import { ParagraphTopicModel } from "./paragraph-topic.model";
import { ParagraphAttemptModel, IParagraphRevision } from "./paragraph-attempt.model";
import { aiService } from "../ai/ai.service";
import { UserModel } from "../users/user.model";
import { CefrLevel } from "../../types";
import { PARAGRAPH_DIFFICULTY_MAP, ParagraphDifficulty, difficultyFromLevelTier } from "./paragraph-difficulty.constants";

const MAX_REVISIONS = 30;
const AI_PARAGRAPH_EXCLUDE_PROMPT_LIMIT = 5;

export class ParagraphService {
    private isMongoActive(): boolean {
        return mongoose.connection.readyState === 1;
    }

    private assertMongo() {
        if (!this.isMongoActive()) {
            throw new Error("Chức năng Viết đoạn văn tạm thời không khả dụng, vui lòng thử lại sau.");
        }
    }

    async getTopics(query: { levelTier?: string; page?: number; limit?: number }) {
        this.assertMongo();
        const limit = query.limit || 20;
        const page = query.page || 1;
        const skip = (page - 1) * limit;

        const filter: any = { isActive: true };
        if (query.levelTier && query.levelTier !== "All") filter.levelTier = query.levelTier;

        const [topics, total] = await Promise.all([
            ParagraphTopicModel.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
            ParagraphTopicModel.countDocuments(filter),
        ]);

        return { topics, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getTopicById(id: string) {
        this.assertMongo();
        const topic = await ParagraphTopicModel.findById(id).lean();
        if (!topic) throw new Error("Không tìm thấy đề bài");
        return topic;
    }

    async getUserAttempt(userId: string, topicId: string) {
        this.assertMongo();
        return ParagraphAttemptModel.findOne({ userId, topicId }).lean();
    }

    async getUserAttempts(userId: string, query: { page?: number; limit?: number }) {
        this.assertMongo();
        const limit = query.limit || 10;
        const page = query.page || 1;
        const skip = (page - 1) * limit;

        const [attempts, total] = await Promise.all([
            ParagraphAttemptModel.find({ userId })
                .select("-revisions")
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ParagraphAttemptModel.countDocuments({ userId }),
        ]);

        return { attempts, total, page, totalPages: Math.ceil(total / limit) };
    }

    async submitAttempt(userId: string, topicId: string, text: string) {
        this.assertMongo();

        const topic = await ParagraphTopicModel.findById(topicId).lean();
        if (!topic) throw new Error("Không tìm thấy đề bài");
        const t = topic as any;

        const evalResult = await aiService.evaluateParagraph({
            instruction: t.instruction,
            levelTier: t.levelTier,
            minWords: t.minWords,
            maxWords: t.maxWords,
            requirements: t.requirements,
            userAnswer: text,
        });

        const revision: IParagraphRevision = {
            text,
            wordCount: evalResult.wordCount,
            score: evalResult.overallScore,
            criteria: {
                content: evalResult.content,
                organization: evalResult.organization,
                coherence: evalResult.coherence,
                grammar: evalResult.grammar,
                vocabulary: evalResult.vocabulary,
                sentenceStructure: evalResult.sentenceStructure,
                naturalness: evalResult.naturalness,
            },
            errors: evalResult.errors,
            strengths: evalResult.strengths,
            weaknesses: evalResult.weaknesses,
            correctedSuggestion: evalResult.correctedSuggestion,
            overallFeedback: evalResult.overallFeedback,
            aiProvider: evalResult.provider,
            submittedAt: new Date(),
        };

        const attempt = await ParagraphAttemptModel.findOneAndUpdate(
            { userId, topicId },
            {
                $set: { currentUserAnswer: text, currentScore: evalResult.overallScore },
                $push: { revisions: { $each: [revision], $slice: -MAX_REVISIONS } },
            },
            { upsert: true, new: true }
        );
        if (!attempt) throw new Error("Không thể lưu bài làm");

        return {
            attemptId: attempt._id.toString(),
            topicId,
            currentUserAnswer: attempt.currentUserAnswer,
            currentScore: attempt.currentScore,
            revisionCount: attempt.revisions.length,
            scoreHistory: attempt.revisions.map((r: any) => r.score),
            evaluation: evalResult,
        };
    }

    // --- AI-generated topics ---

    async generateAIParagraphTopic(userId: string, topic: string, difficulty: ParagraphDifficulty) {
        this.assertMongo();

        const { levelTier, minWords, maxWords } = PARAGRAPH_DIFFICULTY_MAP[difficulty];

        // CEFR level is always looked up server-side from the user's own account —
        // never trusted from the request body (no level field is even accepted here).
        const user = await UserModel.findById(userId).select("level").lean();
        if (!user) throw new Error("Không tìm thấy người dùng");
        const cefrLevel = ((user as any).level as CefrLevel) || "B1";

        const recentTopics = await ParagraphTopicModel.find({
            createdBy: userId,
            topicCategory: topic,
            levelTier,
            source: "ai_user_generated",
        })
            .select("instruction")
            .sort({ createdAt: -1 })
            .limit(AI_PARAGRAPH_EXCLUDE_PROMPT_LIMIT)
            .lean();
        const excludePrompts = (recentTopics as any[]).map((t) => t.instruction).filter(Boolean);

        const generated = await aiService.generateParagraphPrompt({
            topic,
            difficulty,
            levelTier,
            minWords,
            maxWords,
            cefrLevel,
            excludePrompts,
        });

        const saved = await ParagraphTopicModel.create({
            title: topic,
            instruction: generated.promptVi,
            levelTier,
            minWords,
            maxWords,
            requirements: generated.requirements || [],
            topicCategory: topic,
            isActive: true,
            createdBy: userId,
            source: "ai_user_generated",
        });

        // Deliberately safe subset only — paragraph evaluation has no reference
        // answer concept, but keep the response minimal regardless.
        return {
            topicId: String(saved._id),
            promptVi: saved.instruction,
            topic,
            difficulty,
            cefrLevel,
            minWords: saved.minWords,
            maxWords: saved.maxWords,
            requirements: saved.requirements,
        };
    }

    async getMyParagraphStats(userId: string) {
        this.assertMongo();

        const attempts = await ParagraphAttemptModel.find({ userId }).select("topicId currentScore revisions").lean();
        if (attempts.length === 0) {
            return { topicsPracticed: 0, totalAttempts: 0, averageScore: 0, bestScore: 0, byDifficulty: [] as any[] };
        }

        const topicIds = [...new Set((attempts as any[]).map((a) => String(a.topicId)))];
        const topics = await ParagraphTopicModel.find({ _id: { $in: topicIds } }).select("levelTier").lean();
        const tierMap = new Map((topics as any[]).map((t) => [String(t._id), t.levelTier]));

        const totalAttempts = (attempts as any[]).reduce((sum, a) => sum + (a.revisions?.length || 0), 0);
        const scores = (attempts as any[]).map((a) => a.currentScore);
        const averageScore = Math.round(scores.reduce((s: number, v: number) => s + v, 0) / scores.length);
        const bestScore = Math.max(...scores);

        const byTierScores: Record<string, number[]> = { Beginner: [], Intermediate: [], Advanced: [] };
        for (const a of attempts as any[]) {
            const tier = tierMap.get(String(a.topicId));
            if (tier && byTierScores[tier]) byTierScores[tier].push(a.currentScore);
        }

        const byDifficulty = Object.entries(byTierScores)
            .filter(([, arr]) => arr.length > 0)
            .map(([tier, arr]) => ({
                difficulty: difficultyFromLevelTier(tier as any),
                averageScore: Math.round(arr.reduce((s, v) => s + v, 0) / arr.length),
                count: arr.length,
            }));

        return {
            topicsPracticed: attempts.length,
            totalAttempts,
            averageScore,
            bestScore,
            byDifficulty,
        };
    }

    // --- Admin ---

    async getAllTopicsAdmin(query: any) {
        this.assertMongo();
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 30;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (query.levelTier && query.levelTier !== "All") filter.levelTier = query.levelTier;
        if (query.search) {
            filter.$or = [
                { title: { $regex: query.search, $options: "i" } },
                { instruction: { $regex: query.search, $options: "i" } },
            ];
        }

        const [topics, total] = await Promise.all([
            ParagraphTopicModel.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
            ParagraphTopicModel.countDocuments(filter),
        ]);

        return { topics, total, page, totalPages: Math.ceil(total / limit) };
    }

    async createTopic(data: any, createdBy?: string) {
        this.assertMongo();
        return ParagraphTopicModel.create({ ...data, createdBy });
    }

    async updateTopic(id: string, data: any) {
        this.assertMongo();
        const updated = await ParagraphTopicModel.findByIdAndUpdate(id, { $set: data }, { new: true });
        if (!updated) throw new Error("Không tìm thấy đề bài");
        return updated;
    }

    async deleteTopic(id: string) {
        this.assertMongo();
        const deleted = await ParagraphTopicModel.findByIdAndDelete(id);
        if (!deleted) throw new Error("Không tìm thấy đề bài");
        return deleted;
    }

    async getAllAttemptsAdmin(query: any) {
        this.assertMongo();
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 30;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (query.topicId) filter.topicId = query.topicId;
        if (query.userId) filter.userId = query.userId;

        const [attempts, total] = await Promise.all([
            ParagraphAttemptModel.find(filter).select("-revisions").sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
            ParagraphAttemptModel.countDocuments(filter),
        ]);

        const userIds = [...new Set(attempts.map((a: any) => String(a.userId)))];
        const users = await UserModel.find({ _id: { $in: userIds } }).select("name email").lean();
        const userMap = new Map(users.map((u: any) => [String(u._id), u]));

        const attemptsWithUser = attempts.map((a: any) => {
            const user = userMap.get(String(a.userId));
            return { ...a, userName: user ? user.name : "", userEmail: user ? user.email : "" };
        });

        return { attempts: attemptsWithUser, total, page, totalPages: Math.ceil(total / limit) };
    }
}

export const paragraphService = new ParagraphService();
