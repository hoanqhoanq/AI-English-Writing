import mongoose from "mongoose";
import { ParagraphTopicModel } from "./paragraph-topic.model";
import { ParagraphAttemptModel, IParagraphRevision } from "./paragraph-attempt.model";
import { aiService } from "../ai/ai.service";
import { UserModel } from "../users/user.model";

const MAX_REVISIONS = 30;

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
