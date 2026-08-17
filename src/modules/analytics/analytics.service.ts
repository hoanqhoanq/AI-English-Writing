import mongoose from "mongoose";
import { WritingAttemptModel } from "../writing/attempt.model";
import { WritingErrorModel } from "../writing/error.model";
import { AIAnalysisModel } from "./analysis.model";
import { UserModel } from "../users/user.model";
import { memoryStore, MemoryAIAnalysis } from "../../db/memoryStore";
import { aiService } from "../ai/ai.service";
import { CefrLevel } from "../../types";

export class AnalyticsService {
    private isMongoActive(): boolean {
        return mongoose.connection.readyState === 1;
    }

    async getOverview(userId: string) {
        if (this.isMongoActive()) {
            const attempts = await WritingAttemptModel.find({ userId }).sort({ createdAt: 1 });
            const total = attempts.length;
            if (total === 0) {
                return {
                    totalAttempts: 0,
                    averageScore: 0,
                    highestScore: 0,
                    lowestScore: 0,
                    accuracy: 0,
                    totalErrors: 0,
                    correctCount: 0,
                    partialCount: 0,
                    incorrectCount: 0,
                };
            }

            const scores = attempts.map((a) => a.finalScore);
            const totalScore = scores.reduce((acc, s) => acc + s, 0);
            const avgScore = Math.round(totalScore / total);
            const highestScore = Math.max(...scores);
            const lowestScore = Math.min(...scores);

            const correctCount = attempts.filter((a) => a.status === "correct").length;
            const partialCount = attempts.filter((a) => a.status === "partially_correct").length;
            const incorrectCount = attempts.filter((a) => a.status === "incorrect").length;
            const accuracy = Math.round((correctCount / total) * 100);

            const totalErrors = attempts.reduce((acc, a) => acc + (a.errors?.length || 0), 0);

            return {
                totalAttempts: total,
                averageScore: avgScore,
                highestScore,
                lowestScore,
                accuracy,
                totalErrors,
                correctCount,
                partialCount,
                incorrectCount,
            };
        } else {
            const attempts = memoryStore.attempts.filter((a) => a.userId === userId);
            const total = attempts.length;
            if (total === 0) {
                return {
                    totalAttempts: 0,
                    averageScore: 0,
                    highestScore: 0,
                    lowestScore: 0,
                    accuracy: 0,
                    totalErrors: 0,
                    correctCount: 0,
                    partialCount: 0,
                    incorrectCount: 0,
                };
            }

            const scores = attempts.map((a) => a.finalScore);
            const totalScore = scores.reduce((acc, s) => acc + s, 0);
            const avgScore = Math.round(totalScore / total);
            const highestScore = Math.max(...scores);
            const lowestScore = Math.min(...scores);

            const correctCount = attempts.filter((a) => a.status === "correct").length;
            const partialCount = attempts.filter((a) => a.status === "partially_correct").length;
            const incorrectCount = attempts.filter((a) => a.status === "incorrect").length;
            const accuracy = Math.round((correctCount / total) * 100);

            const totalErrors = attempts.reduce((acc, a) => acc + (a.errors?.length || 0), 0);

            return {
                totalAttempts: total,
                averageScore: avgScore,
                highestScore,
                lowestScore,
                accuracy,
                totalErrors,
                correctCount,
                partialCount,
                incorrectCount,
            };
        }
    }

    async getErrors(userId: string) {
        if (this.isMongoActive()) {
            const errors = await WritingErrorModel.find({ userId });
            const counts: Record<string, number> = {};
            errors.forEach((e) => {
                const key = e.type || "OTHER";
                counts[key] = (counts[key] || 0) + 1;
            });

            const formatted = Object.entries(counts).map(([type, count]) => ({
                type,
                count,
                percentage: errors.length > 0 ? Math.round((count / errors.length) * 100) : 0,
            })).sort((a, b) => b.count - a.count);

            return { totalErrors: errors.length, errorDistribution: formatted };
        } else {
            const errors = memoryStore.errors.filter((e) => e.userId === userId);
            const counts: Record<string, number> = {};
            errors.forEach((e) => {
                const key = e.type || "OTHER";
                counts[key] = (counts[key] || 0) + 1;
            });

            const formatted = Object.entries(counts).map(([type, count]) => ({
                type,
                count,
                percentage: errors.length > 0 ? Math.round((count / errors.length) * 100) : 0,
            })).sort((a, b) => b.count - a.count);

            return { totalErrors: errors.length, errorDistribution: formatted };
        }
    }

    async getTopics(userId: string) {
        if (this.isMongoActive()) {
            const attempts = await WritingAttemptModel.find({ userId });
            const map: Record<string, { total: number; scoreSum: number; errors: number }> = {};

            attempts.forEach((a) => {
                const top = a.topic || "General";
                if (!map[top]) map[top] = { total: 0, scoreSum: 0, errors: 0 };
                map[top].total += 1;
                map[top].scoreSum += a.finalScore;
                map[top].errors += a.errors?.length || 0;
            });

            return Object.entries(map).map(([topic, data]) => ({
                topic,
                total: data.total,
                averageScore: Math.round(data.scoreSum / data.total),
                errors: data.errors,
            })).sort((a, b) => b.total - a.total);
        } else {
            const attempts = memoryStore.attempts.filter((a) => a.userId === userId);
            const map: Record<string, { total: number; scoreSum: number; errors: number }> = {};

            attempts.forEach((a) => {
                const top = a.topic || "General";
                if (!map[top]) map[top] = { total: 0, scoreSum: 0, errors: 0 };
                map[top].total += 1;
                map[top].scoreSum += a.finalScore;
                map[top].errors += a.errors?.length || 0;
            });

            return Object.entries(map).map(([topic, data]) => ({
                topic,
                total: data.total,
                averageScore: Math.round(data.scoreSum / data.total),
                errors: data.errors,
            })).sort((a, b) => b.total - a.total);
        }
    }

    async getGrammar(userId: string) {
        if (this.isMongoActive()) {
            const attempts = await WritingAttemptModel.find({ userId });
            const map: Record<string, { total: number; scoreSum: number; errors: number }> = {};

            attempts.forEach((a) => {
                const grm = a.grammarTopic || "General";
                if (!map[grm]) map[grm] = { total: 0, scoreSum: 0, errors: 0 };
                map[grm].total += 1;
                map[grm].scoreSum += a.finalScore;
                map[grm].errors += a.errors?.length || 0;
            });

            return Object.entries(map).map(([grammarTopic, data]) => ({
                grammarTopic,
                total: data.total,
                averageScore: Math.round(data.scoreSum / data.total),
                errors: data.errors,
            })).sort((a, b) => b.errors - a.errors);
        } else {
            const attempts = memoryStore.attempts.filter((a) => a.userId === userId);
            const map: Record<string, { total: number; scoreSum: number; errors: number }> = {};

            attempts.forEach((a) => {
                const grm = a.grammarTopic || "General";
                if (!map[grm]) map[grm] = { total: 0, scoreSum: 0, errors: 0 };
                map[grm].total += 1;
                map[grm].scoreSum += a.finalScore;
                map[grm].errors += a.errors?.length || 0;
            });

            return Object.entries(map).map(([grammarTopic, data]) => ({
                grammarTopic,
                total: data.total,
                averageScore: Math.round(data.scoreSum / data.total),
                errors: data.errors,
            })).sort((a, b) => b.errors - a.errors);
        }
    }

    async getTrends(userId: string) {
        let attempts: any[] = [];
        if (this.isMongoActive()) {
            attempts = await WritingAttemptModel.find({ userId }).sort({ createdAt: 1 });
        } else {
            attempts = memoryStore.attempts
                .filter((a) => a.userId === userId)
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        // Score progression
        const scoreTimeline = attempts.slice(-15).map((a, idx) => ({
            attemptNumber: idx + 1,
            score: a.finalScore,
            date: new Date(a.createdAt).toLocaleDateString("vi-VN", { month: "numeric", day: "numeric" }),
            level: a.level,
        }));

        // Weekly activity (last 7 days)
        const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
        const weeklyMap: Record<string, { count: number; avgScore: number; sum: number }> = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = days[d.getDay()];
            weeklyMap[key] = { count: 0, avgScore: 0, sum: 0 };
        }

        attempts.forEach((a) => {
            const d = new Date(a.createdAt);
            const key = days[d.getDay()];
            if (weeklyMap[key]) {
                weeklyMap[key].count += 1;
                weeklyMap[key].sum += a.finalScore;
            }
        });

        const weeklyActivity = Object.entries(weeklyMap).map(([day, data]) => ({
            day,
            count: data.count,
            avgScore: data.count > 0 ? Math.round(data.sum / data.count) : 0,
        }));

        return { scoreTimeline, weeklyActivity };
    }

    async performAIAnalysis(userId: string) {
        let userLevel: CefrLevel = "B1";
        let attempts: any[] = [];
        let errors: any[] = [];

        if (this.isMongoActive()) {
            const user = await UserModel.findById(userId);
            if (user) userLevel = user.level;
            attempts = await WritingAttemptModel.find({ userId }).sort({ createdAt: -1 });
            errors = await WritingErrorModel.find({ userId });
        } else {
            const user = memoryStore.users.find((u) => u._id === userId);
            if (user) userLevel = user.level as any;
            attempts = memoryStore.attempts.filter((a) => a.userId === userId);
            errors = memoryStore.errors.filter((e) => e.userId === userId);
        }

        if (attempts.length === 0) {
            return {
                overallLevel: userLevel,
                strengths: ["Chưa có dữ liệu bài làm."],
                weaknesses: ["Hãy hoàn thành ít nhất 3-5 câu để AI chẩn đoán điểm yếu."],
                repeatedErrors: [],
                progress: "stable" as const,
                analysis: "Bạn chưa hoàn thành bài viết nào. Hãy chọn một chủ đề và bắt đầu phiên luyện tập đầu tiên!",
                recommendations: ["Bắt đầu luyện tập với các câu hỏi cấp độ " + userLevel],
            };
        }

        // Aggregate statistics for AI
        const errorTypeCounts: Record<string, number> = {};
        errors.forEach((e) => {
            errorTypeCounts[e.type] = (errorTypeCounts[e.type] || 0) + 1;
        });

        const grammarErrorCounts: Record<string, number> = {};
        errors.forEach((e) => {
            const g = e.grammarTopic || "General";
            grammarErrorCounts[g] = (grammarErrorCounts[g] || 0) + 1;
        });

        const topicMap: Record<string, { total: number; sum: number }> = {};
        attempts.forEach((a) => {
            const t = a.topic || "General";
            if (!topicMap[t]) topicMap[t] = { total: 0, sum: 0 };
            topicMap[t].total += 1;
            topicMap[t].sum += a.finalScore;
        });

        const topicPerformance: Record<string, { total: number; avgScore: number }> = {};
        Object.entries(topicMap).forEach(([t, val]) => {
            topicPerformance[t] = { total: val.total, avgScore: Math.round(val.sum / val.total) };
        });

        const avgScore = Math.round(
            attempts.reduce((acc, a) => acc + a.finalScore, 0) / attempts.length
        );

        const recentMistakes = attempts
            .filter((a) => a.errors && a.errors.length > 0)
            .slice(0, 8)
            .map((a) => ({
                vietnamese: a.vietnameseSentence,
                userAnswer: a.userAnswer,
                correctAnswer: a.referenceAnswer,
                errors: a.errors,
            }));

        // Call AI Service
        const aiResult = await aiService.analyzeWeakness({
            overallLevel: userLevel,
            totalAttempts: attempts.length,
            averageScore: avgScore,
            totalErrors: errors.length,
            errorTypeCounts,
            grammarErrorCounts,
            topicPerformance,
            recentMistakes,
        });

        // Save Analysis to DB or Memory
        const dataSnapshot = {
            totalAttempts: attempts.length,
            averageScore: avgScore,
            totalErrors: errors.length,
            errorTypesSummary: errorTypeCounts,
            grammarSummary: grammarErrorCounts as any,
        };

        if (this.isMongoActive()) {
            const analysisDoc = await AIAnalysisModel.create({
                userId,
                overallLevel: aiResult.overallLevel,
                strengths: aiResult.strengths,
                weaknesses: aiResult.weaknesses,
                repeatedErrors: aiResult.repeatedErrors,
                progress: aiResult.progress,
                analysis: aiResult.analysis,
                recommendations: aiResult.recommendations,
                dataSnapshot,
            });
            return analysisDoc;
        } else {
            const memDoc: MemoryAIAnalysis = {
                _id: "ana_" + Date.now(),
                userId,
                overallLevel: aiResult.overallLevel,
                strengths: aiResult.strengths,
                weaknesses: aiResult.weaknesses,
                repeatedErrors: aiResult.repeatedErrors,
                progress: aiResult.progress,
                analysis: aiResult.analysis,
                recommendations: aiResult.recommendations,
                dataSnapshot,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            memoryStore.analyses.unshift(memDoc);
            return memDoc;
        }
    }

    async getLatestAIAnalysis(userId: string) {
        if (this.isMongoActive()) {
            const doc = await AIAnalysisModel.findOne({ userId }).sort({ createdAt: -1 });
            if (!doc) return this.performAIAnalysis(userId);
            return doc;
        } else {
            const doc = memoryStore.analyses.find((a) => a.userId === userId);
            if (!doc) return this.performAIAnalysis(userId);
            return doc;
        }
    }

    async getSystemStats() {
        if (this.isMongoActive()) {
            const [users, questions, attempts, errors] = await Promise.all([
                UserModel.find().select("-password"),
                import("../writing/question.model").then((m) => m.WritingQuestionModel.find()),
                WritingAttemptModel.find().sort({ createdAt: -1 }),
                WritingErrorModel.find(),
            ]);

            const totalUsers = users.length;
            const activeUsers = users.filter((u) => u.isActive).length;
            const lockedUsers = totalUsers - activeUsers;
            const adminUsers = users.filter((u) => u.role === "admin").length;
            const learnerUsers = totalUsers - adminUsers;

            const totalQuestions = questions.length;
            const activeQuestions = questions.filter((q) => q.isActive).length;

            const questionsByLevel: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
            questions.forEach((q) => {
                if (questionsByLevel[q.level] !== undefined) questionsByLevel[q.level]++;
            });

            const totalAttempts = attempts.length;
            const avgScore = totalAttempts
                ? Math.round(attempts.reduce((sum, a) => sum + (a.finalScore || 0), 0) / totalAttempts)
                : 0;

            const correctCount = attempts.filter((a) => a.status === "correct").length;
            const accuracy = totalAttempts ? Math.round((correctCount / totalAttempts) * 100) : 0;

            const errorTypeCounts: Record<string, number> = {};
            errors.forEach((e) => {
                const t = e.type || "OTHER";
                errorTypeCounts[t] = (errorTypeCounts[t] || 0) + 1;
            });

            return {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    locked: lockedUsers,
                    admins: adminUsers,
                    learners: learnerUsers,
                },
                questions: {
                    total: totalQuestions,
                    active: activeQuestions,
                    byLevel: questionsByLevel,
                },
                attempts: {
                    total: totalAttempts,
                    averageScore: avgScore,
                    accuracy,
                    correctCount,
                },
                errors: {
                    total: errors.length,
                    byType: errorTypeCounts,
                },
            };
        } else {
            const users = memoryStore.users;
            const questions = memoryStore.questions;
            const attempts = memoryStore.attempts;
            const errors = memoryStore.errors;

            const totalUsers = users.length;
            const activeUsers = users.filter((u) => u.isActive).length;
            const lockedUsers = totalUsers - activeUsers;
            const adminUsers = users.filter((u) => u.role === "admin").length;
            const learnerUsers = totalUsers - adminUsers;

            const totalQuestions = questions.length;
            const activeQuestions = questions.filter((q) => q.isActive).length;

            const questionsByLevel: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
            questions.forEach((q) => {
                if (questionsByLevel[q.level] !== undefined) questionsByLevel[q.level]++;
            });

            const totalAttempts = attempts.length;
            const avgScore = totalAttempts
                ? Math.round(attempts.reduce((sum, a) => sum + (a.finalScore || 0), 0) / totalAttempts)
                : 0;

            const correctCount = attempts.filter((a) => a.status === "correct").length;
            const accuracy = totalAttempts ? Math.round((correctCount / totalAttempts) * 100) : 0;

            const errorTypeCounts: Record<string, number> = {};
            errors.forEach((e) => {
                const t = e.type || "OTHER";
                errorTypeCounts[t] = (errorTypeCounts[t] || 0) + 1;
            });

            return {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    locked: lockedUsers,
                    admins: adminUsers,
                    learners: learnerUsers,
                },
                questions: {
                    total: totalQuestions,
                    active: activeQuestions,
                    byLevel: questionsByLevel,
                },
                attempts: {
                    total: totalAttempts,
                    averageScore: avgScore,
                    accuracy,
                    correctCount,
                },
                errors: {
                    total: errors.length,
                    byType: errorTypeCounts,
                },
            };
        }
    }
}

export const analyticsService = new AnalyticsService();

