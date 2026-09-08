import mongoose from "mongoose";
import { GrammarTopicModel } from "../topics/grammar.model";
import { WritingQuestionModel } from "../writing/question.model";
import { WritingAttemptModel } from "../writing/attempt.model";
import { UserModel } from "../users/user.model";
import { analyticsService } from "../analytics/analytics.service";
import { ParagraphAttemptModel } from "../paragraph/paragraph-attempt.model";
import {
    CHAPTER_MASTERY_THRESHOLD,
    EXERCISE_COMPLETE_THRESHOLD,
    PARAGRAPH_GOOD_SCORE_THRESHOLD,
    XP_CHAPTER_COMPLETED,
    XP_MASTERY_TEST_PASSED,
    XP_PARAGRAPH_GOOD_ATTEMPT,
    XP_PER_ATTEMPT,
} from "./journey.constants";

export type ChapterStatus = "locked" | "in_progress" | "mastery_test" | "completed" | "no_content";
export type ExerciseStatus = "locked" | "available" | "completed";

export class JourneyService {
    private isMongoActive(): boolean {
        return mongoose.connection.readyState === 1;
    }

    private assertMongo() {
        if (!this.isMongoActive()) {
            throw new Error("Chức năng Lộ trình học tạm thời không khả dụng, vui lòng thử lại sau.");
        }
    }

    async getChapters(userId: string) {
        this.assertMongo();

        const [grammarTopics, questions, attempts] = await Promise.all([
            GrammarTopicModel.find({ isActive: true }).sort({ order: 1 }).lean(),
            WritingQuestionModel.find({ isActive: true }).select("_id grammarTopic").lean(),
            WritingAttemptModel.find({ userId }).select("questionId grammarTopic status finalScore").lean(),
        ]);

        const bestByQuestion = new Map<string, { status: string; finalScore: number }>();
        for (const a of attempts as any[]) {
            const qid = String(a.questionId);
            const existing = bestByQuestion.get(qid);
            if (!existing || a.finalScore > existing.finalScore) {
                bestByQuestion.set(qid, { status: a.status, finalScore: a.finalScore });
            }
        }

        const questionCountByGrammar = new Map<string, string[]>();
        for (const q of questions as any[]) {
            const arr = questionCountByGrammar.get(q.grammarTopic) || [];
            arr.push(String(q._id));
            questionCountByGrammar.set(q.grammarTopic, arr);
        }

        let chainOk = true;
        return (grammarTopics as any[]).map((gt) => {
            const questionIds = questionCountByGrammar.get(gt.name) || [];
            const totalExercises = questionIds.length;

            let completedExercises = 0;
            let scoreSum = 0;
            for (const qid of questionIds) {
                const best = bestByQuestion.get(qid);
                if (best && (best.status === "correct" || best.finalScore >= EXERCISE_COMPLETE_THRESHOLD)) {
                    completedExercises += 1;
                    scoreSum += best.finalScore;
                }
            }
            const masteryScore = completedExercises > 0 ? Math.round(scoreSum / completedExercises) : 0;

            let status: ChapterStatus;
            if (!chainOk) status = "locked";
            else if (totalExercises === 0) status = "no_content";
            else if (completedExercises < totalExercises) status = "in_progress";
            else if (masteryScore < CHAPTER_MASTERY_THRESHOLD) status = "mastery_test";
            else status = "completed";

            // A chapter with no content yet cannot block the rest of the journey.
            chainOk = status === "completed" || status === "no_content";

            return {
                grammarTopicId: String(gt._id),
                grammarTopic: gt.name,
                description: gt.description,
                level: gt.level,
                order: gt.order,
                totalExercises,
                completedExercises,
                masteryScore,
                status,
            };
        });
    }

    async getChapterDetail(userId: string, grammarTopicId: string) {
        this.assertMongo();

        const grammarTopic = await GrammarTopicModel.findById(grammarTopicId).lean();
        if (!grammarTopic) throw new Error("Không tìm thấy chủ điểm ngữ pháp");
        const gt = grammarTopic as any;

        const [questions, attempts] = await Promise.all([
            WritingQuestionModel.find({ grammarTopic: gt.name, isActive: true })
                .select("vietnameseSentence level difficulty topic createdAt")
                .sort({ createdAt: 1 })
                .lean(),
            WritingAttemptModel.find({ userId, grammarTopic: gt.name })
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

        let prevCompleted = true;
        const exercises = (questions as any[]).map((q) => {
            const best = bestByQuestion.get(String(q._id));
            const completed = !!best && (best.status === "correct" || best.finalScore >= EXERCISE_COMPLETE_THRESHOLD);
            const status: ExerciseStatus = !prevCompleted ? "locked" : completed ? "completed" : "available";
            prevCompleted = completed;

            return {
                questionId: String(q._id),
                vietnameseSentence: q.vietnameseSentence,
                level: q.level,
                difficulty: q.difficulty,
                topic: q.topic,
                status,
                bestScore: best ? best.finalScore : null,
                attempts: best ? best.attempts : 0,
            };
        });

        const completedExercises = exercises.filter((e) => e.status === "completed").length;
        const masteryScore =
            completedExercises > 0
                ? Math.round(
                      exercises
                          .filter((e) => e.status === "completed")
                          .reduce((sum, e) => sum + (e.bestScore || 0), 0) / completedExercises
                  )
                : 0;
        const masteryTestUnlocked = exercises.length > 0 && completedExercises === exercises.length;
        const masteryTestPassed = masteryTestUnlocked && masteryScore >= CHAPTER_MASTERY_THRESHOLD;

        return {
            grammarTopicId: String(gt._id),
            grammarTopic: gt.name,
            description: gt.description,
            level: gt.level,
            exercises,
            totalExercises: exercises.length,
            completedExercises,
            masteryScore,
            requiredMasteryScore: CHAPTER_MASTERY_THRESHOLD,
            masteryTestUnlocked,
            masteryTestPassed,
        };
    }

    async getOverview(userId: string) {
        this.assertMongo();

        const user = await UserModel.findById(userId).select("streak totalWriting averageScore level").lean();
        if (!user) throw new Error("Không tìm thấy người dùng");
        const u = user as any;

        const chapters = await this.getChapters(userId);
        const completedChapters = chapters.filter((c) => c.status === "completed").length;

        const paragraphGoodAttempts = await ParagraphAttemptModel.countDocuments({
            userId,
            currentScore: { $gte: PARAGRAPH_GOOD_SCORE_THRESHOLD },
        }).catch(() => 0);

        const totalWriting = u.totalWriting || 0;
        const averageScore = u.averageScore || 0;

        const xp = Math.round(
            totalWriting * XP_PER_ATTEMPT +
                (totalWriting * averageScore) / 20 +
                completedChapters * XP_CHAPTER_COMPLETED +
                completedChapters * XP_MASTERY_TEST_PASSED +
                paragraphGoodAttempts * XP_PARAGRAPH_GOOD_ATTEMPT
        );
        const level = Math.floor(Math.sqrt(xp / 100)) + 1;

        const achievements = [
            { id: "first_attempt", title: "Bài luyện đầu tiên", description: "Hoàn thành bài luyện viết đầu tiên", earned: totalWriting >= 1 },
            { id: "streak_7", title: "Chuỗi 7 ngày", description: "Duy trì chuỗi luyện tập 7 ngày", earned: (u.streak || 0) >= 7 },
            { id: "chapters_3", title: "Nhà chinh phục ngữ pháp", description: "Hoàn thành 3 chương ngữ pháp", earned: completedChapters >= 3 },
            { id: "paragraph_pro", title: "Cây viết đoạn văn", description: "Đạt điểm tốt ở 5 bài viết đoạn văn", earned: paragraphGoodAttempts >= 5 },
        ];

        return {
            xp,
            level,
            streak: u.streak || 0,
            totalWriting,
            averageScore,
            completedChapters,
            totalChapters: chapters.length,
            achievements,
        };
    }

    async getRecommendations(userId: string) {
        this.assertMongo();

        const [grammarStats, grammarTopics] = await Promise.all([
            analyticsService.getGrammar(userId),
            GrammarTopicModel.find({ isActive: true }).lean(),
        ]);

        const gtMap = new Map((grammarTopics as any[]).map((g) => [g.name, g]));

        return grammarStats
            .filter((g) => g.total > 0 && gtMap.has(g.grammarTopic))
            .sort((a, b) => a.averageScore - b.averageScore)
            .slice(0, 5)
            .map((g) => {
                const gt = gtMap.get(g.grammarTopic);
                return {
                    grammarTopic: g.grammarTopic,
                    grammarTopicId: String(gt._id),
                    averageScore: g.averageScore,
                    totalAttempts: g.total,
                    totalErrors: g.errors,
                };
            });
    }
}

export const journeyService = new JourneyService();
