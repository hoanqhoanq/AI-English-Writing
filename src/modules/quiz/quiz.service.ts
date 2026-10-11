import mongoose from "mongoose";
import { QuizAttemptModel } from "./quiz-attempt.model";
import { LearningTopicModel } from "../learning/learning-topic.model";
import { TopicModel } from "../topics/topic.model";
import { aiService } from "../ai/ai.service";
import { CefrLevel } from "../../types";
import { IGeneratedQuizQuestion } from "../ai/ai.interface";
import { tokenize, isNearDuplicate, normalizeQuestionText, buildDistributionPlan, shuffle, TenseDistributionEntry } from "./quiz.utils";

const ALL_LABEL = "All";
const ALL_TENSES_SENTINEL = "all";
const MAX_GENERATION_ROUNDS = 3;

interface ResolvedTenses {
    titles: string[];
    wasAllRequested: boolean;
}

export class QuizService {
    private assertMongo() {
        if (mongoose.connection.readyState !== 1) {
            throw new Error("Chức năng Grammar Quiz tạm thời không khả dụng, vui lòng thử lại sau.");
        }
    }

    private async fetchGrammarTenses(): Promise<{ slug: string; title: string }[]> {
        const docs = await LearningTopicModel.find({ category: "grammar", isPublished: true })
            .select("slug title")
            .lean();
        return (docs as any[]).map((d) => ({ slug: d.slug as string, title: d.title as string }));
    }

    private async resolveTenses(params: { tenses?: string[]; grammar?: string }): Promise<ResolvedTenses> {
        const grammarTenses = await this.fetchGrammarTenses();
        const allTitles = grammarTenses.map((t) => t.title);

        if (params.tenses !== undefined) {
            if (params.tenses.length === 0) {
                throw new Error("Vui lòng chọn ít nhất một thì.");
            }

            const hasAllSentinel = params.tenses.some((t) => t.trim().toLowerCase() === ALL_TENSES_SENTINEL);
            if (hasAllSentinel) {
                return { titles: allTitles, wasAllRequested: true };
            }

            const bySlug = new Map(grammarTenses.map((t) => [t.slug.toLowerCase(), t.title]));
            const matched: string[] = [];
            for (const raw of params.tenses) {
                const title = bySlug.get(raw.trim().toLowerCase());
                if (!title) {
                    throw new Error(`Thì ngữ pháp "${raw}" không hợp lệ`);
                }
                if (!matched.includes(title)) matched.push(title);
            }
            return { titles: matched, wasAllRequested: matched.length === allTitles.length };
        }

        // Legacy single-tense path (grammar: string) — unchanged behavior.
        if (!params.grammar || params.grammar === ALL_LABEL) {
            return { titles: allTitles, wasAllRequested: true };
        }
        const match = allTitles.find((title) => title.toLowerCase() === params.grammar!.trim().toLowerCase());
        if (!match) {
            throw new Error(`Thì ngữ pháp "${params.grammar}" không hợp lệ`);
        }
        return { titles: [match], wasAllRequested: false };
    }

    private async resolveTopic(topic?: string): Promise<string> {
        if (!topic || topic === ALL_LABEL) {
            return ALL_LABEL;
        }
        const found = await TopicModel.findOne({ name: topic.trim(), isActive: true }).select("name").lean();
        if (!found) {
            throw new Error(`Chủ đề "${topic}" không hợp lệ`);
        }
        return (found as any).name as string;
    }

    // Layer 3 of duplicate defense: generates in rounds, validating each
    // returned question's tense against the allowed set and its text against
    // everything already accepted (exact + near-duplicate, via quiz.utils),
    // asking the AI for exactly the still-missing amounts on each subsequent
    // round (with the already-accepted questions excluded) until the full
    // distribution plan is satisfied or MAX_GENERATION_ROUNDS is reached.
    private async generateValidatedQuestions(
        difficulty: CefrLevel,
        plan: TenseDistributionEntry[],
        topicPrompt: string
    ): Promise<IGeneratedQuizQuestion[]> {
        const allowedTitles = plan.map((p) => p.tense);
        const remaining: Record<string, number> = Object.fromEntries(plan.map((p) => [p.tense, p.count]));
        const acceptedByTense = new Map<string, IGeneratedQuizQuestion[]>(plan.map((p) => [p.tense, []]));
        const acceptedTokenSets: Set<string>[] = [];
        const acceptedTexts: string[] = [];
        const acceptedNormalizedTexts = new Set<string>();

        for (let round = 1; round <= MAX_GENERATION_ROUNDS; round++) {
            const targetsThisRound = Object.fromEntries(Object.entries(remaining).filter(([, c]) => c > 0));
            if (Object.keys(targetsThisRound).length === 0) break;
            const totalNeeded = Object.values(targetsThisRound).reduce((sum, c) => sum + c, 0);

            let batch: IGeneratedQuizQuestion[] = [];
            try {
                batch = await aiService.generateQuiz({
                    difficulty,
                    grammarTopics: Object.keys(targetsThisRound),
                    perTenseTargets: targetsThisRound,
                    topic: topicPrompt,
                    questionCount: totalNeeded,
                    excludeQuestions: round > 1 ? acceptedTexts : undefined,
                });
            } catch (err: any) {
                console.warn(`[Quiz Service] Generation round ${round}/${MAX_GENERATION_ROUNDS} failed: ${err.message}`);
                continue;
            }

            for (const q of batch) {
                const tenseKey = allowedTitles.find((t) => t.toLowerCase() === q.tense.trim().toLowerCase());
                if (!tenseKey) continue; // AI produced a tense outside the requested set — drop
                if ((remaining[tenseKey] || 0) <= 0) continue; // already satisfied for this tense

                // Exact-duplicate check applies to EVERY provider, no exemption —
                // this is what actually stops the Heuristic fallback's tiny
                // 2-per-tense template pool from repeating the identical
                // question verbatim once a tense needs a 3rd/4th/... question
                // (templates[i % templates.length] cycles back to template 0).
                const normalizedText = normalizeQuestionText(q.question);
                if (acceptedNormalizedTexts.has(normalizedText)) continue;

                // The Heuristic fallback's 2 hand-written templates per tense
                // are genuinely different sentences (not paraphrases of each
                // other), so near-duplicate (Jaccard) filtering only exists to
                // catch AI-generated near-repeats — exempting Heuristic from
                // it just avoids spuriously rejecting its 2 legitimately
                // distinct templates, NOT from exact-duplicate protection above.
                const isHeuristic = q.provider === "heuristic_fallback";
                const tokens = tokenize(q.question);
                if (!isHeuristic && isNearDuplicate(tokens, acceptedTokenSets)) continue;

                acceptedNormalizedTexts.add(normalizedText);
                acceptedTokenSets.push(tokens);
                acceptedTexts.push(q.question);
                acceptedByTense.get(tenseKey)!.push(q);
                remaining[tenseKey] = remaining[tenseKey] - 1;
            }
        }

        const stillShort = Object.entries(remaining).filter(([, c]) => c > 0);
        if (stillShort.length > 0) {
            const totalTarget = plan.reduce((sum, p) => sum + p.count, 0);
            const totalAccepted = totalTarget - stillShort.reduce((sum, [, c]) => sum + c, 0);
            throw new Error(
                `AI không thể tạo đủ ${totalTarget} câu hỏi hợp lệ (không trùng lặp) sau ${MAX_GENERATION_ROUNDS} lần thử. Đã tạo được ${totalAccepted}/${totalTarget} câu hợp lệ. Vui lòng thử lại hoặc giảm số câu/số thì.`
            );
        }

        const ordered = plan.flatMap((p) => acceptedByTense.get(p.tense)!);
        return shuffle(ordered);
    }

    async generateQuiz(
        userId: string,
        params: { difficulty: CefrLevel; tenses?: string[]; grammar?: string; topic?: string; questionCount: number }
    ) {
        this.assertMongo();

        const { titles: requestedTenses, wasAllRequested } = await this.resolveTenses({
            tenses: params.tenses,
            grammar: params.grammar,
        });
        const topicLabel = await this.resolveTopic(params.topic);
        const topicPrompt =
            topicLabel === ALL_LABEL ? "nhiều chủ đề đời sống hàng ngày khác nhau" : topicLabel;

        const plan = buildDistributionPlan(requestedTenses, params.questionCount);
        const finalTenses = plan.map((p) => p.tense);
        const grammarLabel =
            finalTenses.length < requestedTenses.length
                ? finalTenses.join(", ")
                : wasAllRequested
                ? "Tất cả 12 thì"
                : requestedTenses.join(", ");

        const generated = await this.generateValidatedQuestions(params.difficulty, plan, topicPrompt);

        const questions = generated.map((q, index) => ({
            questionId: `q${index + 1}`,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            selectedAnswer: null,
            isCorrect: null,
            explanation: q.explanation,
            tense: q.tense,
            difficulty: (q.difficulty || params.difficulty) as CefrLevel,
            topic: q.topic || topicLabel,
        }));

        const attempt = await QuizAttemptModel.create({
            userId,
            difficulty: params.difficulty,
            grammar: grammarLabel,
            tenses: finalTenses,
            topic: topicLabel,
            questionCount: questions.length,
            questions,
            correctCount: 0,
            wrongCount: 0,
            score: 0,
            status: "generated",
            startedAt: new Date(),
        });

        // Deliberately safe subset only — never correctAnswer/explanation before submit.
        return {
            quizId: attempt._id.toString(),
            difficulty: attempt.difficulty,
            grammar: attempt.grammar,
            tenses: attempt.tenses,
            topic: attempt.topic,
            totalQuestions: questions.length,
            questions: questions.map((q, index) => ({
                questionId: q.questionId,
                question: q.question,
                options: q.options,
                questionNumber: index + 1,
                totalQuestions: questions.length,
                difficulty: q.difficulty,
                grammar: q.tense,
                topic: q.topic,
            })),
        };
    }

    async submitQuiz(userId: string, quizId: string, answers: { questionId: string; selectedAnswer: number }[]) {
        this.assertMongo();

        const attempt = await QuizAttemptModel.findOne({ _id: quizId, userId });
        if (!attempt) throw new Error("Không tìm thấy bài Quiz");
        if (attempt.status === "completed") {
            throw new Error("Bài Quiz này đã được nộp trước đó");
        }

        const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedAnswer]));

        let correctCount = 0;
        for (const q of attempt.questions) {
            const selected = answerMap.has(q.questionId) ? answerMap.get(q.questionId)! : null;
            q.selectedAnswer = selected;
            q.isCorrect = selected !== null && selected === q.correctAnswer;
            if (q.isCorrect) correctCount++;
        }

        const total = attempt.questions.length;
        const wrongCount = total - correctCount;
        const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

        attempt.correctCount = correctCount;
        attempt.wrongCount = wrongCount;
        attempt.score = score;
        attempt.status = "completed";
        attempt.completedAt = new Date();
        await attempt.save();

        return {
            quizId: attempt._id.toString(),
            difficulty: attempt.difficulty,
            grammar: attempt.grammar,
            tenses: attempt.tenses,
            topic: attempt.topic,
            totalQuestions: total,
            correctCount,
            wrongCount,
            score,
            questions: attempt.questions.map((q: any) => ({
                questionId: q.questionId,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                selectedAnswer: q.selectedAnswer,
                isCorrect: q.isCorrect,
                explanation: q.explanation,
                tense: q.tense,
                difficulty: q.difficulty,
                topic: q.topic,
            })),
        };
    }

    async getHistory(userId: string, query: { page?: number; limit?: number }) {
        this.assertMongo();
        const limit = query.limit || 10;
        const page = query.page || 1;
        const skip = (page - 1) * limit;

        const [attempts, total] = await Promise.all([
            QuizAttemptModel.find({ userId, status: "completed" })
                .select("-questions")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            QuizAttemptModel.countDocuments({ userId, status: "completed" }),
        ]);

        return { attempts, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getHistoryDetail(userId: string, id: string) {
        this.assertMongo();
        const attempt = await QuizAttemptModel.findOne({ _id: id, userId, status: "completed" }).lean();
        if (!attempt) throw new Error("Không tìm thấy lịch sử Quiz này");
        return attempt;
    }

    async getQuizStats(userId: string) {
        this.assertMongo();
        const attempts = await QuizAttemptModel.find({ userId, status: "completed" }).lean();

        if (attempts.length === 0) {
            return {
                totalQuizzes: 0,
                totalQuestions: 0,
                averageScore: 0,
                overallAccuracy: 0,
                accuracyByTense: [] as { tense: string; accuracy: number; total: number }[],
                accuracyByLevel: [] as { level: string; accuracy: number; total: number }[],
            };
        }

        const totalQuizzes = attempts.length;
        const averageScore = Math.round(
            (attempts as any[]).reduce((sum, a) => sum + (a.score || 0), 0) / totalQuizzes
        );

        const tenseStats = new Map<string, { correct: number; total: number }>();
        const levelStats = new Map<string, { correct: number; total: number }>();
        let totalQuestions = 0;
        let totalCorrect = 0;

        for (const attempt of attempts as any[]) {
            for (const q of attempt.questions || []) {
                totalQuestions++;
                if (q.isCorrect) totalCorrect++;

                const tenseEntry = tenseStats.get(q.tense) || { correct: 0, total: 0 };
                tenseEntry.total++;
                if (q.isCorrect) tenseEntry.correct++;
                tenseStats.set(q.tense, tenseEntry);

                const levelEntry = levelStats.get(q.difficulty) || { correct: 0, total: 0 };
                levelEntry.total++;
                if (q.isCorrect) levelEntry.correct++;
                levelStats.set(q.difficulty, levelEntry);
            }
        }

        const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        const accuracyByTense = Array.from(tenseStats.entries())
            .map(([tense, s]) => ({ tense, accuracy: Math.round((s.correct / s.total) * 100), total: s.total }))
            .sort((a, b) => a.accuracy - b.accuracy);

        const accuracyByLevel = Array.from(levelStats.entries())
            .map(([level, s]) => ({ level, accuracy: Math.round((s.correct / s.total) * 100), total: s.total }))
            .sort((a, b) => a.level.localeCompare(b.level));

        return {
            totalQuizzes,
            totalQuestions,
            averageScore,
            overallAccuracy,
            accuracyByTense,
            accuracyByLevel,
        };
    }
}

export const quizService = new QuizService();
