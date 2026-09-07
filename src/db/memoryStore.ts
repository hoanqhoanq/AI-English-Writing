import { SEED_TOPICS, SEED_GRAMMAR, SEED_QUESTIONS } from "../seeds/seedData";
import bcrypt from "bcryptjs";
import { config } from "../config/env";

export interface MemoryUser {
    _id: string;
    name: string;
    email: string;
    password: string;
    role: "user" | "admin";
    avatar?: string;
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    target: "General English" | "TOEIC" | "IELTS" | "Communication" | "Academic English";
    dailyGoal: number;
    streak: number;
    totalWriting: number;
    averageScore: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface MemoryTopic {
    _id: string;
    name: string;
    description: string;
    icon: string;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface MemoryGrammar {
    _id: string;
    name: string;
    description: string;
    level: string;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface MemoryQuestion {
    _id: string;
    vietnameseSentence: string;
    referenceAnswer: string;
    alternativeAnswers: string[];
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    topic: string;
    grammarTopic: string;
    difficulty: "easy" | "medium" | "hard";
    keywords: string[];
    isActive: boolean;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MemorySession {
    _id: string;
    userId: string;
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    topic?: string;
    grammarTopic?: string;
    difficulty?: "easy" | "medium" | "hard";
    questions: string[];
    currentQuestionIndex: number;
    totalQuestions: number;
    completedQuestions: number;
    scoreTotal: number;
    startedAt: Date;
    completedAt?: Date;
    status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
    createdAt: Date;
    updatedAt: Date;
}

export interface MemoryAttempt {
    _id: string;
    userId: string;
    sessionId?: string;
    questionId: string;
    vietnameseSentence: string;
    referenceAnswer: string;
    userAnswer: string;
    status: "correct" | "partially_correct" | "incorrect";
    aiScore: number;
    finalScore: number;
    summary?: string;
    correctAnswer?: string;
    alternativeAnswers?: string[];
    errors: any[];
    strengths: string[];
    weaknesses?: string[];
    overallFeedback: string;
    recommendations: string[];
    scoreBreakdown?: {
        grammar: number;
        vocabulary: number;
        meaning: number;
        sentenceStructure: number;
        naturalness: number;
    };
    aiProvider?: string;
    level: string;
    topic: string;
    grammarTopic: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MemoryError {
    _id: string;
    userId: string;
    attemptId: string;
    questionId: string;
    type: string;
    category?: string;
    severity?: "minor" | "major";
    wrongText: string;
    correctText: string;
    explanation: string;
    topic: string;
    grammarTopic: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MemoryRefreshToken {
    _id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt?: Date;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MemoryAIAnalysis {
    _id: string;
    userId: string;
    overallLevel: string;
    strengths: string[];
    weaknesses: string[];
    repeatedErrors: any[];
    progress: "improving" | "stable" | "needs_attention";
    analysis: string;
    recommendations: string[];
    dataSnapshot: any;
    createdAt: Date;
    updatedAt: Date;
}

class MemoryStore {
    users: MemoryUser[] = [];
    topics: MemoryTopic[] = [];
    grammars: MemoryGrammar[] = [];
    questions: MemoryQuestion[] = [];
    sessions: MemorySession[] = [];
    attempts: MemoryAttempt[] = [];
    errors: MemoryError[] = [];
    analyses: MemoryAIAnalysis[] = [];
    refreshTokens: MemoryRefreshToken[] = [];

    private initialized = false;

    constructor() {
        this.initialize();
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    }

    public initialize(): void {
        if (this.initialized) return;

        const salt = bcrypt.genSaltSync(10);

        // Bootstrap exactly one admin account, only if explicitly configured via
        // ADMIN_EMAIL/ADMIN_PASSWORD env vars. No public demo/mock accounts are
        // auto-created — real users must register through /api/auth/register.
        if (config.adminBootstrapEmail && config.adminBootstrapPassword) {
            const adminUser: MemoryUser = {
                _id: "usr_admin_bootstrap",
                name: "Administrator",
                email: config.adminBootstrapEmail.toLowerCase().trim(),
                password: bcrypt.hashSync(config.adminBootstrapPassword, salt),
                role: "admin",
                level: "C2",
                target: "Academic English",
                dailyGoal: 10,
                streak: 0,
                totalWriting: 0,
                averageScore: 0,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.users.push(adminUser);
        }

        // Seed topics
        this.topics = SEED_TOPICS.map((t, idx) => ({
            _id: `top_${idx + 1}`,
            name: t.name,
            description: t.description,
            icon: t.icon,
            isActive: true,
            order: t.order,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        // Seed grammars
        this.grammars = SEED_GRAMMAR.map((g, idx) => ({
            _id: `grm_${idx + 1}`,
            name: g.name,
            description: g.description,
            level: g.level,
            isActive: true,
            order: g.order,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        // Seed questions
        this.questions = SEED_QUESTIONS.map((q, idx) => ({
            _id: `q_${(idx + 1).toString().padStart(3, "0")}`,
            vietnameseSentence: q.vietnameseSentence,
            referenceAnswer: q.referenceAnswer,
            alternativeAnswers: q.alternativeAnswers,
            level: q.level as any,
            topic: q.topic,
            grammarTopic: q.grammarTopic,
            difficulty: q.difficulty as any,
            keywords: q.keywords,
            isActive: true,
            createdBy: this.users.find((u) => u.role === "admin")?._id || "system",
            createdAt: new Date(Date.now() - (100 - idx) * 3600000),
            updatedAt: new Date(),
        }));

        this.initialized = true;
    }
}

export const memoryStore = new MemoryStore();
