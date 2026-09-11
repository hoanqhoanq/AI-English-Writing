import mongoose from "mongoose";
import { LearningTopicModel } from "./learning-topic.model";
import { LearningProgressModel, LearningSection } from "./learning-progress.model";
import { WritingQuestionModel } from "../writing/question.model";
import { WritingAttemptModel } from "../writing/attempt.model";
import { WritingErrorModel } from "../writing/error.model";
import { UserModel } from "../users/user.model";
import { analyticsService } from "../analytics/analytics.service";
import { ParagraphAttemptModel } from "../paragraph/paragraph-attempt.model";
import { aiService } from "../ai/ai.service";
import { AI_WRITING_TOPICS, findAIWritingTopic } from "./ai-writing-topics.constants";
import { CefrLevel, DifficultyLevel } from "../../types";

const PRACTICE_GOOD_SCORE = 70;
const PARAGRAPH_GOOD_SCORE_THRESHOLD = 70;
const TOTAL_SECTIONS = 4; // learn, examples, practice, aiWriting
const XP_PER_ATTEMPT = 8;
const XP_TOPIC_COMPLETED = 100;
const XP_PARAGRAPH_GOOD_ATTEMPT = 40;
const AI_WRITING_EXCLUDE_PROMPT_LIMIT = 5;

const CEFR_TO_DIFFICULTY: Record<CefrLevel, DifficultyLevel> = {
    A1: "easy",
    A2: "easy",
    B1: "medium",
    B2: "medium",
    C1: "hard",
    C2: "hard",
};

export type TopicStatus = "not_started" | "in_progress" | "completed";

export class LearningService {
    private assertMongo() {
        if (mongoose.connection.readyState !== 1) {
            throw new Error("Chức năng Writing Learning tạm thời không khả dụng, vui lòng thử lại sau.");
        }
    }

    private computeMastery(practiceAccuracy: number | null): string | null {
        if (practiceAccuracy === null) return null;
        if (practiceAccuracy >= 85) return "Strong";
        if (practiceAccuracy >= 60) return "Developing";
        return "Needs Review";
    }

    private deriveStatus(completion: number): TopicStatus {
        if (completion <= 0) return "not_started";
        if (completion >= 100) return "completed";
        return "in_progress";
    }

    async getTopics(userId: string, query: { category?: string; search?: string }) {
        this.assertMongo();
        const filter: any = { isPublished: true };
        if (query.category && query.category !== "all") filter.category = query.category;
        if (query.search) {
            filter.$or = [
                { title: { $regex: query.search, $options: "i" } },
                { titleVi: { $regex: query.search, $options: "i" } },
                { description: { $regex: query.search, $options: "i" } },
            ];
        }

        const [topics, progressDocs] = await Promise.all([
            LearningTopicModel.find(filter)
                .select("slug title titleVi category description practiceTag cefrLevel difficulty order")
                .sort({ category: 1, order: 1 })
                .lean(),
            LearningProgressModel.find({ userId }).lean(),
        ]);

        const progressMap = new Map((progressDocs as any[]).map((p) => [String(p.topicId), p]));

        const practiceTags = (topics as any[]).map((t) => t.practiceTag).filter(Boolean);
        const attemptStats =
            practiceTags.length > 0
                ? await WritingAttemptModel.aggregate([
                      { $match: { userId, grammarTopic: { $in: practiceTags } } },
                      { $group: { _id: "$grammarTopic", count: { $sum: 1 }, avgScore: { $avg: "$finalScore" } } },
                  ])
                : [];
        const attemptMap = new Map(attemptStats.map((s: any) => [s._id, s]));

        return (topics as any[]).map((t) => {
            const progress: any = progressMap.get(String(t._id));
            const attempt: any = t.practiceTag ? attemptMap.get(t.practiceTag) : undefined;
            const completedSections: string[] = progress?.completedSections || [];
            const completion = Math.round((completedSections.length / TOTAL_SECTIONS) * 100);
            const practiceAccuracy = attempt ? Math.round(attempt.avgScore) : null;

            return {
                _id: String(t._id),
                slug: t.slug,
                title: t.title,
                titleVi: t.titleVi,
                category: t.category,
                description: t.description,
                cefrLevel: t.cefrLevel,
                difficulty: t.difficulty,
                order: t.order,
                status: this.deriveStatus(completion),
                completion,
                practiceAccuracy,
                masteryLabel: this.computeMastery(practiceAccuracy),
            };
        });
    }

    async getTopicDetail(userId: string, slug: string) {
        this.assertMongo();
        const topic = await LearningTopicModel.findOne({ slug, isPublished: true }).lean();
        if (!topic) throw new Error("Không tìm thấy nội dung học này");
        const t = topic as any;

        let exercises: any[] = [];
        if (t.practiceTag) {
            const [questions, attempts] = await Promise.all([
                WritingQuestionModel.find({ grammarTopic: t.practiceTag, isActive: true })
                    .select("vietnameseSentence level difficulty topic")
                    .sort({ createdAt: 1 })
                    .lean(),
                WritingAttemptModel.find({ userId, grammarTopic: t.practiceTag })
                    .select("questionId status finalScore")
                    .lean(),
            ]);

            const bestByQuestion = new Map<string, { status: string; finalScore: number; attempts: number }>();
            for (const a of attempts as any[]) {
                const qid = String(a.questionId);
                const cur = bestByQuestion.get(qid) || { status: "incorrect", finalScore: 0, attempts: 0 };
                cur.attempts += 1;
                if (a.finalScore >= cur.finalScore) {
                    cur.finalScore = a.finalScore;
                    cur.status = a.status;
                }
                bestByQuestion.set(qid, cur);
            }

            exercises = (questions as any[]).map((q) => {
                const best = bestByQuestion.get(String(q._id));
                return {
                    questionId: String(q._id),
                    vietnameseSentence: q.vietnameseSentence,
                    level: q.level,
                    difficulty: q.difficulty,
                    topic: q.topic,
                    bestScore: best ? best.finalScore : null,
                    attempts: best ? best.attempts : 0,
                    completed: !!best && (best.status === "correct" || best.finalScore >= PRACTICE_GOOD_SCORE),
                };
            });
        }

        const attemptedExercises = exercises.filter((e) => e.attempts > 0);
        const practiceAccuracy =
            attemptedExercises.length > 0
                ? Math.round(attemptedExercises.reduce((sum, e) => sum + (e.bestScore || 0), 0) / attemptedExercises.length)
                : null;
        const totalAttempts = attemptedExercises.reduce((sum, e) => sum + e.attempts, 0);

        const commonErrorsCount = t.practiceTag
            ? await WritingErrorModel.countDocuments({ userId, grammarTopic: t.practiceTag })
            : 0;

        // `topicId` is a Mixed field storing the string form (see markSectionViewed) —
        // querying with a raw ObjectId here would silently never match.
        const progress: any = await LearningProgressModel.findOne({ userId, topicId: String(t._id) }).lean();
        const completedSections: string[] = progress?.completedSections || [];
        const completion = Math.round((completedSections.length / TOTAL_SECTIONS) * 100);

        return {
            _id: String(t._id),
            slug: t.slug,
            title: t.title,
            titleVi: t.titleVi,
            category: t.category,
            description: t.description,
            theory: t.theory,
            examples: t.examples,
            commonMistakes: t.commonMistakes,
            practiceTag: t.practiceTag,
            externalPracticePath: t.externalPracticePath,
            cefrLevel: t.cefrLevel,
            difficulty: t.difficulty,
            exercises,
            totalExercises: exercises.length,
            progress: {
                status: this.deriveStatus(completion),
                completion,
                completedSections,
                practiceAccuracy,
                attempts: totalAttempts,
                commonErrorsCount,
                masteryLabel: this.computeMastery(practiceAccuracy),
            },
        };
    }

    async markSectionViewed(userId: string, slug: string, section: LearningSection) {
        this.assertMongo();
        const topic = await LearningTopicModel.findOne({ slug }).select("_id").lean();
        if (!topic) throw new Error("Không tìm thấy nội dung học này");
        const topicId = String((topic as any)._id);

        const progress = await LearningProgressModel.findOneAndUpdate(
            { userId, topicId },
            { $addToSet: { completedSections: section }, $set: { lastAccessedAt: new Date() } },
            { upsert: true, new: true }
        );
        return { completedSections: progress!.completedSections };
    }

    async getProgressOverview(userId: string) {
        this.assertMongo();

        const user = await UserModel.findById(userId).select("streak totalWriting averageScore").lean();
        if (!user) throw new Error("Không tìm thấy người dùng");
        const u = user as any;

        const [topics, progressDocs, grammarStats] = await Promise.all([
            LearningTopicModel.find({ isPublished: true }).select("_id title category practiceTag").lean(),
            LearningProgressModel.find({ userId }).lean(),
            analyticsService.getGrammar(userId),
        ]);

        const progressMap = new Map((progressDocs as any[]).map((p) => [String(p.topicId), p]));

        let grammarTotal = 0,
            grammarCompleted = 0,
            writingTotal = 0,
            writingCompleted = 0,
            notStarted = 0,
            inProgress = 0,
            completed = 0;
        const recentTopics: { title: string; category: string; lastAccessedAt: Date }[] = [];

        for (const t of topics as any[]) {
            const progress: any = progressMap.get(String(t._id));
            const completedSections: string[] = progress?.completedSections || [];
            const completion = Math.round((completedSections.length / TOTAL_SECTIONS) * 100);
            const status = this.deriveStatus(completion);

            if (status === "not_started") notStarted++;
            else if (status === "in_progress") inProgress++;
            else completed++;

            if (t.category === "grammar") {
                grammarTotal++;
                if (status === "completed") grammarCompleted++;
            } else {
                writingTotal++;
                if (status === "completed") writingCompleted++;
            }

            if (progress?.lastAccessedAt) {
                recentTopics.push({ title: t.title, category: t.category, lastAccessedAt: progress.lastAccessedAt });
            }
        }

        recentTopics.sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());

        const weakTopics = grammarStats
            .filter((g) => g.total > 0)
            .sort((a, b) => a.averageScore - b.averageScore)
            .slice(0, 5)
            .map((g) => ({ grammarTopic: g.grammarTopic, averageScore: g.averageScore, totalAttempts: g.total }));

        const paragraphGoodAttempts = await ParagraphAttemptModel.countDocuments({
            userId,
            currentScore: { $gte: PARAGRAPH_GOOD_SCORE_THRESHOLD },
        }).catch(() => 0);

        const totalWriting = u.totalWriting || 0;
        const averageScore = u.averageScore || 0;
        const xp = Math.round(
            totalWriting * XP_PER_ATTEMPT +
                (totalWriting * averageScore) / 20 +
                completed * XP_TOPIC_COMPLETED +
                paragraphGoodAttempts * XP_PARAGRAPH_GOOD_ATTEMPT
        );
        const level = Math.floor(Math.sqrt(xp / 100)) + 1;

        return {
            xp,
            level,
            streak: u.streak || 0,
            averageScore,
            totalTopics: topics.length,
            notStarted,
            inProgress,
            completed,
            grammarProgressPct: grammarTotal > 0 ? Math.round((grammarCompleted / grammarTotal) * 100) : 0,
            writingProgressPct: writingTotal > 0 ? Math.round((writingCompleted / writingTotal) * 100) : 0,
            weakTopics,
            recentTopics: recentTopics.slice(0, 5),
        };
    }

    // --- AI Writing ---

    getAIWritingTopics() {
        return AI_WRITING_TOPICS;
    }

    async generateAIWritingQuestion(
        userId: string,
        tenseSlug: string,
        topicKey?: string,
        customTopic?: string
    ) {
        this.assertMongo();

        const topicDoc = await LearningTopicModel.findOne({ slug: tenseSlug, isPublished: true })
            .select("title titleVi")
            .lean();
        if (!topicDoc) throw new Error("Không tìm thấy chủ điểm ngữ pháp này");
        const tense = topicDoc as any;

        let topicLabel: string;
        let topicLabelVi: string;
        if (customTopic) {
            topicLabel = customTopic;
            topicLabelVi = customTopic;
        } else {
            const found = topicKey ? findAIWritingTopic(topicKey) : undefined;
            if (!found) throw new Error("Chủ đề không hợp lệ");
            topicLabel = found.label;
            topicLabelVi = found.labelVi;
        }

        // CEFR level is always looked up server-side from the user's own account —
        // never trusted from the request body (no level field is even accepted here).
        const user = await UserModel.findById(userId).select("level").lean();
        if (!user) throw new Error("Không tìm thấy người dùng");
        const level = ((user as any).level as CefrLevel) || "B1";
        const difficulty = CEFR_TO_DIFFICULTY[level];

        const recentQuestions = await WritingQuestionModel.find({
            createdBy: userId,
            grammarTopic: tense.title,
            topic: topicLabel,
            source: "ai_user_generated",
        })
            .select("vietnameseSentence")
            .sort({ createdAt: -1 })
            .limit(AI_WRITING_EXCLUDE_PROMPT_LIMIT)
            .lean();
        const excludePrompts = (recentQuestions as any[]).map((q) => q.vietnameseSentence).filter(Boolean);

        const [generated] = await aiService.generateQuestions({
            level,
            difficulty,
            grammarTopics: [tense.title],
            topicPrompt: topicLabel,
            numberOfQuestions: 1,
            excludePrompts,
        });
        if (!generated) throw new Error("AI không thể tạo câu hỏi hợp lệ. Vui lòng thử lại.");

        const saved = await WritingQuestionModel.create({
            vietnameseSentence: generated.vietnameseSentence,
            referenceAnswer: generated.referenceAnswer,
            alternativeAnswers: generated.alternativeAnswers || [],
            level: generated.level || level,
            topic: topicLabel,
            grammarTopic: tense.title,
            difficulty: generated.difficulty || difficulty,
            keywords: generated.keywords || [],
            isActive: true,
            createdBy: userId,
            source: "ai_user_generated",
        });

        // Deliberately safe subset only — never referenceAnswer/alternativeAnswers.
        return {
            questionId: String(saved._id),
            promptVi: saved.vietnameseSentence,
            tense: tenseSlug,
            tenseVi: tense.titleVi,
            topic: topicLabel,
            topicVi: topicLabelVi,
            difficulty: saved.difficulty,
        };
    }

    // --- Admin ---

    async getAllTopicsAdmin(query: any) {
        this.assertMongo();
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const skip = (page - 1) * limit;

        const filter: any = {};
        if (query.category && query.category !== "all") filter.category = query.category;
        if (query.search) {
            filter.$or = [
                { title: { $regex: query.search, $options: "i" } },
                { slug: { $regex: query.search, $options: "i" } },
            ];
        }

        const [topics, total] = await Promise.all([
            LearningTopicModel.find(filter).sort({ category: 1, order: 1 }).skip(skip).limit(limit),
            LearningTopicModel.countDocuments(filter),
        ]);

        return { topics, total, page, totalPages: Math.ceil(total / limit) };
    }

    async createTopic(data: any, createdBy?: string) {
        this.assertMongo();
        const existing = await LearningTopicModel.findOne({ slug: data.slug });
        if (existing) throw new Error("Slug này đã tồn tại, vui lòng chọn slug khác");
        return LearningTopicModel.create({ ...data, createdBy });
    }

    async updateTopic(id: string, data: any) {
        this.assertMongo();
        const updated = await LearningTopicModel.findByIdAndUpdate(id, { $set: data }, { new: true });
        if (!updated) throw new Error("Không tìm thấy nội dung học");
        return updated;
    }

    async deleteTopic(id: string) {
        this.assertMongo();
        const deleted = await LearningTopicModel.findByIdAndDelete(id);
        if (!deleted) throw new Error("Không tìm thấy nội dung học");
        return deleted;
    }
}

export const learningService = new LearningService();
