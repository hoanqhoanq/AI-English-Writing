import mongoose from "mongoose";
import { WritingQuestionModel } from "./question.model";
import { WritingSessionModel } from "./session.model";
import { WritingAttemptModel } from "./attempt.model";
import { WritingErrorModel } from "./error.model";
import { UserModel } from "../users/user.model";
import { memoryStore, MemorySession, MemoryAttempt, MemoryError } from "../../db/memoryStore";
import { aiService } from "../ai/ai.service";
import { CefrLevel, DifficultyLevel } from "../../types";

export class WritingService {
    private isMongoActive(): boolean {
        return mongoose.connection.readyState === 1;
    }

    async getQuestions(query: {
        level?: string;
        topic?: string;
        grammarTopic?: string;
        difficulty?: string;
        limit?: number;
        page?: number;
    }) {
        const limit = query.limit || 20;
        const page = query.page || 1;
        const skip = (page - 1) * limit;

        if (this.isMongoActive()) {
            const filter: any = { isActive: true };
            if (query.level) filter.level = query.level;
            if (query.topic && query.topic !== "All") filter.topic = query.topic;
            if (query.grammarTopic && query.grammarTopic !== "All") filter.grammarTopic = query.grammarTopic;
            if (query.difficulty && query.difficulty !== "All") filter.difficulty = query.difficulty;

            const [questions, total] = await Promise.all([
                WritingQuestionModel.find(filter)
                    .select("-referenceAnswer -alternativeAnswers")
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 }),
                WritingQuestionModel.countDocuments(filter),
            ]);

            return { questions, total, page, totalPages: Math.ceil(total / limit) };
        } else {
            let filtered = memoryStore.questions.filter((q) => q.isActive);
            if (query.level) filtered = filtered.filter((q) => q.level === query.level);
            if (query.topic && query.topic !== "All") filtered = filtered.filter((q) => q.topic === query.topic);
            if (query.grammarTopic && query.grammarTopic !== "All")
                filtered = filtered.filter((q) => q.grammarTopic === query.grammarTopic);
            if (query.difficulty && query.difficulty !== "All")
                filtered = filtered.filter((q) => q.difficulty === query.difficulty);

            const total = filtered.length;
            const paged = filtered.slice(skip, skip + limit).map((q) => ({
                _id: q._id,
                vietnameseSentence: q.vietnameseSentence,
                level: q.level,
                topic: q.topic,
                grammarTopic: q.grammarTopic,
                difficulty: q.difficulty,
                keywords: q.keywords,
                createdAt: q.createdAt,
            }));

            return { questions: paged, total, page, totalPages: Math.ceil(total / limit) };
        }
    }

    async getQuestionById(id: string, includeAnswers: boolean = false) {
        if (this.isMongoActive()) {
            const q = await WritingQuestionModel.findById(id);
            if (!q) throw new Error("Không tìm thấy câu hỏi");
            if (!includeAnswers) {
                const { referenceAnswer, alternativeAnswers, ...safe } = q.toObject();
                return safe;
            }
            return q;
        } else {
            const q = memoryStore.questions.find((item) => item._id === id);
            if (!q) throw new Error("Không tìm thấy câu hỏi");
            if (!includeAnswers) {
                const { referenceAnswer, alternativeAnswers, ...safe } = q;
                return safe;
            }
            return q;
        }
    }

    async createQuestion(data: any) {
        if (this.isMongoActive()) {
            const newQ = await WritingQuestionModel.create({
                vietnameseSentence: data.vietnameseSentence,
                referenceAnswer: data.referenceAnswer,
                alternativeAnswers: Array.isArray(data.alternativeAnswers)
                    ? data.alternativeAnswers
                    : typeof data.alternativeAnswers === "string"
                    ? data.alternativeAnswers.split("\n").map((s: string) => s.trim()).filter(Boolean)
                    : [],
                level: data.level || "B1",
                topic: data.topic || "Daily Life",
                grammarTopic: data.grammarTopic || "General",
                difficulty: data.difficulty || "medium",
                keywords: Array.isArray(data.keywords)
                    ? data.keywords
                    : typeof data.keywords === "string"
                    ? data.keywords.split(",").map((s: string) => s.trim()).filter(Boolean)
                    : [],
                isActive: data.isActive !== undefined ? data.isActive : true,
                createdBy: data.createdBy,
            });
            return newQ;
        } else {
            const newQ = {
                _id: "q_" + Date.now(),
                vietnameseSentence: data.vietnameseSentence,
                referenceAnswer: data.referenceAnswer,
                alternativeAnswers: Array.isArray(data.alternativeAnswers)
                    ? data.alternativeAnswers
                    : typeof data.alternativeAnswers === "string"
                    ? data.alternativeAnswers.split("\n").map((s: string) => s.trim()).filter(Boolean)
                    : [],
                level: data.level || "B1",
                topic: data.topic || "Daily Life",
                grammarTopic: data.grammarTopic || "General",
                difficulty: data.difficulty || "medium",
                keywords: Array.isArray(data.keywords)
                    ? data.keywords
                    : typeof data.keywords === "string"
                    ? data.keywords.split(",").map((s: string) => s.trim()).filter(Boolean)
                    : [],
                isActive: data.isActive !== undefined ? data.isActive : true,
                createdBy: data.createdBy,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            memoryStore.questions.unshift(newQ);
            return newQ;
        }
    }

    async updateQuestion(id: string, data: any) {
        if (this.isMongoActive()) {
            const updated = await WritingQuestionModel.findByIdAndUpdate(id, { $set: data }, { new: true });
            if (!updated) throw new Error("Không tìm thấy câu hỏi");
            return updated;
        } else {
            const idx = memoryStore.questions.findIndex((q) => q._id === id);
            if (idx === -1) throw new Error("Không tìm thấy câu hỏi");
            memoryStore.questions[idx] = {
                ...memoryStore.questions[idx],
                ...data,
                updatedAt: new Date(),
            };
            return memoryStore.questions[idx];
        }
    }

    async deleteQuestion(id: string) {
        if (this.isMongoActive()) {
            const deleted = await WritingQuestionModel.findByIdAndDelete(id);
            if (!deleted) throw new Error("Không tìm thấy câu hỏi");
            return deleted;
        } else {
            const idx = memoryStore.questions.findIndex((q) => q._id === id);
            if (idx === -1) throw new Error("Không tìm thấy câu hỏi");
            const deleted = memoryStore.questions.splice(idx, 1)[0];
            return deleted;
        }
    }

    async getAllQuestionsAdmin(query: any) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const skip = (page - 1) * limit;

        if (this.isMongoActive()) {
            const filter: any = {};
            if (query.level && query.level !== "All") filter.level = query.level;
            if (query.topic && query.topic !== "All") filter.topic = query.topic;
            if (query.difficulty && query.difficulty !== "All") filter.difficulty = query.difficulty;
            if (query.search) {
                filter.$or = [
                    { vietnameseSentence: { $regex: query.search, $options: "i" } },
                    { referenceAnswer: { $regex: query.search, $options: "i" } },
                ];
            }

            const [questions, total] = await Promise.all([
                WritingQuestionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
                WritingQuestionModel.countDocuments(filter),
            ]);
            return { questions, total, page, totalPages: Math.ceil(total / limit) };
        } else {
            let list = [...memoryStore.questions];
            if (query.level && query.level !== "All") list = list.filter((q) => q.level === query.level);
            if (query.topic && query.topic !== "All") list = list.filter((q) => q.topic === query.topic);
            if (query.difficulty && query.difficulty !== "All") list = list.filter((q) => q.difficulty === query.difficulty);
            if (query.search) {
                const s = query.search.toLowerCase();
                list = list.filter(
                    (q) =>
                        q.vietnameseSentence.toLowerCase().includes(s) ||
                        q.referenceAnswer.toLowerCase().includes(s)
                );
            }

            const total = list.length;
            const paged = list.slice(skip, skip + limit);
            return { questions: paged, total, page, totalPages: Math.ceil(total / limit) };
        }
    }

    async getAllAttemptsAdmin(query: any) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 30;
        const skip = (page - 1) * limit;

        if (this.isMongoActive()) {
            const filter: any = {};
            if (query.status && query.status !== "All") filter.status = query.status;
            if (query.level && query.level !== "All") filter.level = query.level;
            if (query.userId) filter.userId = query.userId;

            const [attempts, total] = await Promise.all([
                WritingAttemptModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
                WritingAttemptModel.countDocuments(filter),
            ]);
            return { attempts, total, page, totalPages: Math.ceil(total / limit) };
        } else {
            let list = [...memoryStore.attempts];
            if (query.status && query.status !== "All") list = list.filter((a) => a.status === query.status);
            if (query.level && query.level !== "All") list = list.filter((a) => a.level === query.level);
            if (query.userId) list = list.filter((a) => a.userId === query.userId);

            const total = list.length;
            const paged = list.slice(skip, skip + limit).map((a) => {
                const user = memoryStore.users.find((u) => u._id === a.userId);
                return {
                    ...a,
                    userName: user ? user.name : "Học viên",
                    userEmail: user ? user.email : "user@example.com",
                };
            });
            return { attempts: paged, total, page, totalPages: Math.ceil(total / limit) };
        }
    }

    async createSession(userId: string, data: {
        level: CefrLevel;
        topic?: string;
        grammarTopic?: string;
        difficulty?: DifficultyLevel;
        questionCount: number;
    }) {
        const count = data.questionCount || 5;

        let selectedQuestions: any[] = [];

        if (this.isMongoActive()) {
            const filter: any = { isActive: true, level: data.level };
            if (data.topic && (data.topic as string) !== "All") filter.topic = data.topic;
            if (data.grammarTopic && (data.grammarTopic as string) !== "All") filter.grammarTopic = data.grammarTopic;
            if (data.difficulty && (data.difficulty as string) !== "All") filter.difficulty = data.difficulty;

            // Fetch eligible questions and shuffle
            let available = await WritingQuestionModel.find(filter);
            if (available.length < count) {
                // Relax topic/difficulty filter if needed to meet count
                available = await WritingQuestionModel.find({ isActive: true, level: data.level });
            }

            const shuffled = available.sort(() => 0.5 - Math.random());
            selectedQuestions = shuffled.slice(0, count);

            if (selectedQuestions.length === 0) {
                // If still none, get any active
                selectedQuestions = await WritingQuestionModel.find({ isActive: true }).limit(count);
            }

            const session = await WritingSessionModel.create({
                userId,
                level: data.level,
                topic: data.topic,
                grammarTopic: data.grammarTopic,
                difficulty: data.difficulty,
                questions: selectedQuestions.map((q) => q._id),
                currentQuestionIndex: 0,
                totalQuestions: selectedQuestions.length,
                completedQuestions: 0,
                scoreTotal: 0,
                status: "IN_PROGRESS",
            });

            // Return safe questions without referenceAnswer
            const safeQuestions = selectedQuestions.map((q) => ({
                _id: q._id.toString(),
                vietnameseSentence: q.vietnameseSentence,
                level: q.level,
                topic: q.topic,
                grammarTopic: q.grammarTopic,
                difficulty: q.difficulty,
                keywords: q.keywords,
            }));

            return {
                session: {
                    id: session._id.toString(),
                    level: session.level,
                    topic: session.topic,
                    grammarTopic: session.grammarTopic,
                    difficulty: session.difficulty,
                    totalQuestions: session.totalQuestions,
                    completedQuestions: session.completedQuestions,
                    currentQuestionIndex: session.currentQuestionIndex,
                    status: session.status,
                    startedAt: session.startedAt,
                },
                questions: safeQuestions,
            };
        } else {
            let available = memoryStore.questions.filter((q) => q.isActive && q.level === data.level);
            if (data.topic && (data.topic as string) !== "All") available = available.filter((q) => q.topic === data.topic);
            if (data.grammarTopic && (data.grammarTopic as string) !== "All")
                available = available.filter((q) => q.grammarTopic === data.grammarTopic);
            if (data.difficulty && (data.difficulty as string) !== "All")
                available = available.filter((q) => q.difficulty === data.difficulty);

            if (available.length < count) {
                available = memoryStore.questions.filter((q) => q.isActive && q.level === data.level);
            }
            if (available.length === 0) {
                available = memoryStore.questions.filter((q) => q.isActive);
            }

            const shuffled = [...available].sort(() => 0.5 - Math.random());
            selectedQuestions = shuffled.slice(0, count);

            const session: MemorySession = {
                _id: "ses_" + Date.now(),
                userId,
                level: data.level,
                topic: data.topic,
                grammarTopic: data.grammarTopic,
                difficulty: data.difficulty,
                questions: selectedQuestions.map((q) => q._id),
                currentQuestionIndex: 0,
                totalQuestions: selectedQuestions.length,
                completedQuestions: 0,
                scoreTotal: 0,
                startedAt: new Date(),
                status: "IN_PROGRESS",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            memoryStore.sessions.push(session);

            const safeQuestions = selectedQuestions.map((q) => ({
                _id: q._id,
                vietnameseSentence: q.vietnameseSentence,
                level: q.level,
                topic: q.topic,
                grammarTopic: q.grammarTopic,
                difficulty: q.difficulty,
                keywords: q.keywords,
            }));

            return {
                session: {
                    id: session._id,
                    level: session.level,
                    topic: session.topic,
                    grammarTopic: session.grammarTopic,
                    difficulty: session.difficulty,
                    totalQuestions: session.totalQuestions,
                    completedQuestions: session.completedQuestions,
                    currentQuestionIndex: session.currentQuestionIndex,
                    status: session.status,
                    startedAt: session.startedAt,
                },
                questions: safeQuestions,
            };
        }
    }

    async getSessionById(sessionId: string) {
        if (this.isMongoActive()) {
            const session = await WritingSessionModel.findById(sessionId);
            if (!session) throw new Error("Không tìm thấy phiên luyện tập");

            const questions = await WritingQuestionModel.find({
                _id: { $in: session.questions },
            }).select("-referenceAnswer -alternativeAnswers");

            // Maintain original order
            const orderedQuestions = session.questions.map((qId: any) =>
                questions.find((q) => q._id.toString() === qId.toString())
            );

            return { session, questions: orderedQuestions };
        } else {
            const session = memoryStore.sessions.find((s) => s._id === sessionId);
            if (!session) throw new Error("Không tìm thấy phiên luyện tập");

            const questions = session.questions.map((qId) => {
                const q = memoryStore.questions.find((item) => item._id === qId);
                if (!q) return null;
                const { referenceAnswer, alternativeAnswers, ...safe } = q;
                return safe;
            }).filter(Boolean);

            return { session, questions };
        }
    }

    async submitAttempt(
        userId: string,
        data: { sessionId?: string; questionId: string; answer?: string; userAnswer?: string }
    ) {
        const question = await this.getQuestionById(data.questionId, true);
        if (!question) throw new Error("Không tìm thấy câu hỏi");

        const answerText = (data.answer || data.userAnswer || "").trim();

        // 1. AI Evaluation
        const evalResult = await aiService.evaluateWriting({
            vietnameseSentence: question.vietnameseSentence,
            referenceAnswer: question.referenceAnswer,
            alternativeAnswers: question.alternativeAnswers || [],
            userAnswer: answerText,
            level: question.level,
            topic: question.topic,
            grammarTopic: question.grammarTopic,
        });

        // 2. Record Attempt & Errors
        let attemptId: string;

        if (this.isMongoActive()) {
            const attempt = await WritingAttemptModel.create({
                userId,
                sessionId: data.sessionId,
                questionId: data.questionId,
                vietnameseSentence: question.vietnameseSentence,
                referenceAnswer: question.referenceAnswer,
                userAnswer: answerText,
                status: evalResult.status,
                aiScore: evalResult.score,
                finalScore: evalResult.score,
                errors: evalResult.errors,
                strengths: evalResult.strengths,
                overallFeedback: evalResult.overallFeedback,
                recommendations: evalResult.recommendations,
                level: question.level,
                topic: question.topic,
                grammarTopic: question.grammarTopic,
            });
            attemptId = attempt._id.toString();

            // Save individual error logs
            if (evalResult.errors && evalResult.errors.length > 0) {
                const errorDocs = evalResult.errors.map((err) => ({
                    userId,
                    attemptId: attempt._id,
                    questionId: question._id,
                    type: err.type,
                    category: err.category || err.type,
                    wrongText: err.wrongText,
                    correctText: err.correctText,
                    explanation: err.explanation,
                    topic: question.topic,
                    grammarTopic: question.grammarTopic,
                }));
                await WritingErrorModel.insertMany(errorDocs);
            }

            // Update session if present
            if (data.sessionId) {
                const session = await WritingSessionModel.findById(data.sessionId);
                if (session) {
                    session.completedQuestions += 1;
                    session.scoreTotal += evalResult.score;
                    session.currentQuestionIndex = Math.min(
                        session.currentQuestionIndex + 1,
                        session.totalQuestions - 1
                    );
                    if (session.completedQuestions >= session.totalQuestions) {
                        session.status = "COMPLETED";
                        session.completedAt = new Date();
                    }
                    await session.save();
                }
            }

            // Update User stats
            const user = await UserModel.findById(userId);
            if (user) {
                const total = (user.totalWriting || 0) + 1;
                const prevSum = (user.averageScore || 0) * (user.totalWriting || 0);
                const newAvg = Math.round((prevSum + evalResult.score) / total);

                user.totalWriting = total;
                user.averageScore = newAvg;
                user.lastPracticeDate = new Date();
                user.streak = (user.streak || 0) + 1;
                await user.save();
            }
        } else {
            attemptId = "att_" + Date.now();
            const attempt: MemoryAttempt = {
                _id: attemptId,
                userId,
                sessionId: data.sessionId,
                questionId: data.questionId,
                vietnameseSentence: question.vietnameseSentence,
                referenceAnswer: question.referenceAnswer,
                userAnswer: answerText,
                status: evalResult.status,
                aiScore: evalResult.score,
                finalScore: evalResult.score,
                errors: evalResult.errors,
                strengths: evalResult.strengths,
                overallFeedback: evalResult.overallFeedback,
                recommendations: evalResult.recommendations,
                level: question.level,
                topic: question.topic,
                grammarTopic: question.grammarTopic,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            memoryStore.attempts.unshift(attempt);

            // Record memory errors
            if (evalResult.errors && evalResult.errors.length > 0) {
                evalResult.errors.forEach((err, idx) => {
                    const memErr: MemoryError = {
                        _id: `err_${Date.now()}_${idx}`,
                        userId,
                        attemptId,
                        questionId: question._id,
                        type: err.type,
                        category: err.category || err.type,
                        wrongText: err.wrongText,
                        correctText: err.correctText,
                        explanation: err.explanation,
                        topic: question.topic,
                        grammarTopic: question.grammarTopic,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    memoryStore.errors.push(memErr);
                });
            }

            // Update session
            if (data.sessionId) {
                const session = memoryStore.sessions.find((s) => s._id === data.sessionId);
                if (session) {
                    session.completedQuestions += 1;
                    session.scoreTotal += evalResult.score;
                    session.currentQuestionIndex = Math.min(
                        session.currentQuestionIndex + 1,
                        session.totalQuestions - 1
                    );
                    if (session.completedQuestions >= session.totalQuestions) {
                        session.status = "COMPLETED";
                        session.completedAt = new Date();
                    }
                    session.updatedAt = new Date();
                }
            }

            // Update user
            const userIdx = memoryStore.users.findIndex((u) => u._id === userId);
            if (userIdx !== -1) {
                const u = memoryStore.users[userIdx];
                const total = u.totalWriting + 1;
                const prevSum = u.averageScore * u.totalWriting;
                const newAvg = Math.round((prevSum + evalResult.score) / total);

                memoryStore.users[userIdx] = {
                    ...u,
                    totalWriting: total,
                    averageScore: newAvg,
                    streak: u.streak + 1,
                    updatedAt: new Date(),
                };
            }
        }

        return {
            attemptId,
            questionId: data.questionId,
            vietnameseSentence: question.vietnameseSentence,
            referenceAnswer: question.referenceAnswer,
            userAnswer: answerText,
            status: evalResult.status,
            score: evalResult.score,
            errors: evalResult.errors,
            strengths: evalResult.strengths,
            overallFeedback: evalResult.overallFeedback,
            recommendations: evalResult.recommendations,
            scoreBreakdown: evalResult.scoreBreakdown,
            level: question.level,
            topic: question.topic,
            grammarTopic: question.grammarTopic,
        };
    }

    async getAttemptById(attemptId: string) {
        if (this.isMongoActive()) {
            const attempt = await WritingAttemptModel.findById(attemptId);
            if (!attempt) throw new Error("Không tìm thấy bài làm");
            return attempt;
        } else {
            const attempt = memoryStore.attempts.find((a) => a._id === attemptId);
            if (!attempt) throw new Error("Không tìm thấy bài làm");
            return attempt;
        }
    }

    async getHistory(userId: string, query: any) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        if (this.isMongoActive()) {
            const filter: any = { userId };
            if (query.level && query.level !== "All") filter.level = query.level;
            if (query.topic && query.topic !== "All") filter.topic = query.topic;
            if (query.status && query.status !== "All") filter.status = query.status;
            if (query.errorType && query.errorType !== "All") {
                filter["errors.type"] = query.errorType;
            }
            if (query.startDate || query.endDate) {
                filter.createdAt = {};
                if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
                if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
            }

            const [attempts, total] = await Promise.all([
                WritingAttemptModel.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                WritingAttemptModel.countDocuments(filter),
            ]);

            return { attempts, total, page, totalPages: Math.ceil(total / limit) };
        } else {
            let filtered = memoryStore.attempts.filter((a) => a.userId === userId);
            if (query.level && query.level !== "All") filtered = filtered.filter((a) => a.level === query.level);
            if (query.topic && query.topic !== "All") filtered = filtered.filter((a) => a.topic === query.topic);
            if (query.status && query.status !== "All") filtered = filtered.filter((a) => a.status === query.status);
            if (query.errorType && query.errorType !== "All") {
                filtered = filtered.filter((a) => a.errors.some((e: any) => e.type === query.errorType));
            }
            if (query.startDate) {
                const s = new Date(query.startDate).getTime();
                filtered = filtered.filter((a) => new Date(a.createdAt).getTime() >= s);
            }
            if (query.endDate) {
                const e = new Date(query.endDate).getTime();
                filtered = filtered.filter((a) => new Date(a.createdAt).getTime() <= e);
            }

            const total = filtered.length;
            const attempts = filtered.slice(skip, skip + limit);

            return { attempts, total, page, totalPages: Math.ceil(total / limit) };
        }
    }
}

export const writingService = new WritingService();
