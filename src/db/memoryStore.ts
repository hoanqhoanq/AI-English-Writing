import { SEED_TOPICS, SEED_GRAMMAR, SEED_QUESTIONS, DEMO_ADMIN, DEMO_USER } from "../seeds/seedData";
import bcrypt from "bcryptjs";

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
    errors: any[];
    strengths: string[];
    overallFeedback: string;
    recommendations: string[];
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
    wrongText: string;
    correctText: string;
    explanation: string;
    topic: string;
    grammarTopic: string;
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

        // Seed users
        const adminUser: MemoryUser = {
            _id: "usr_admin_001",
            name: DEMO_ADMIN.name,
            email: DEMO_ADMIN.email.toLowerCase(),
            password: bcrypt.hashSync(DEMO_ADMIN.password, salt),
            role: "admin",
            level: "C2",
            target: "Academic English",
            dailyGoal: 10,
            streak: 7,
            totalWriting: 45,
            averageScore: 94,
            isActive: true,
            createdAt: new Date(Date.now() - 30 * 86400000),
            updatedAt: new Date(),
        };

        const standardUser: MemoryUser = {
            _id: "usr_learner_001",
            name: DEMO_USER.name,
            email: DEMO_USER.email.toLowerCase(),
            password: bcrypt.hashSync(DEMO_USER.password, salt),
            role: "user",
            level: "B1",
            target: "IELTS",
            dailyGoal: 5,
            streak: 4,
            totalWriting: 18,
            averageScore: 78,
            isActive: true,
            createdAt: new Date(Date.now() - 14 * 86400000),
            updatedAt: new Date(),
        };

        this.users.push(adminUser, standardUser);

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
            createdBy: "usr_admin_001",
            createdAt: new Date(Date.now() - (100 - idx) * 3600000),
            updatedAt: new Date(),
        }));

        // Seed sample attempts for learner
        this.seedSampleAttempts();

        this.initialized = true;
    }

    private seedSampleAttempts() {
        const sampleRecords = [
            {
                qId: "q_016", // A2: I went to Da Nang last summer.
                userAns: "Yesterday, I go to Da Nang last summer.",
                ref: "I went to Da Nang last summer.",
                vi: "Tôi đã đi Đà Nẵng vào mùa hè năm ngoái.",
                score: 75,
                status: "partially_correct" as const,
                level: "A2",
                topic: "Travel",
                grammar: "Past Simple",
                errors: [
                    {
                        type: "GRAMMAR",
                        category: "TENSE",
                        wrongText: "go",
                        correctText: "went",
                        explanation: "'Last summer' biểu thị hành động đã kết thúc trong quá khứ, nên cần chia động từ ở Past Simple (went).",
                    },
                    {
                        type: "EXTRA_WORD",
                        category: "WORD_CHOICE",
                        wrongText: "Yesterday",
                        correctText: "",
                        explanation: "Câu tiếng Việt không có từ 'hôm qua', thêm 'Yesterday' gây dư thừa.",
                    },
                ],
                strengths: ["Cấu trúc cơ bản rõ ràng", "Đúng tên địa danh và giới từ 'to'"],
                feedback: "Bạn nắm được ý chính nhưng chú ý chia thì quá khứ đơn chính xác.",
                recommendations: ["Ôn tập thì Quá khứ đơn (Past Simple)", "Tránh chèn từ không có trong câu gốc"],
            },
            {
                qId: "q_001",
                userAns: "I wake up at 6 AM every day.",
                ref: "I wake up at 6 AM every day.",
                vi: "Tôi thức dậy lúc 6 giờ sáng mỗi ngày.",
                score: 100,
                status: "correct" as const,
                level: "A1",
                topic: "Daily Life",
                grammar: "Present Simple",
                errors: [],
                strengths: ["Ngữ pháp và từ vựng hoàn hảo", "Tự nhiên chuẩn bản xứ"],
                feedback: "Rất tốt! Câu viết chuẩn xác và lưu loát.",
                recommendations: ["Tiếp tục thử sức với các câu cấp độ B1"],
            },
            {
                qId: "q_031", // B1: I have lived in this city since I graduated from university.
                userAns: "I live in this city since I graduate university.",
                ref: "I have lived in this city since I graduated from university.",
                vi: "Tôi đã sống ở thành phố này từ khi tôi tốt nghiệp đại học.",
                score: 65,
                status: "partially_correct" as const,
                level: "B1",
                topic: "Work",
                grammar: "Present Perfect",
                errors: [
                    {
                        type: "GRAMMAR",
                        category: "TENSE",
                        wrongText: "live",
                        correctText: "have lived",
                        explanation: "Mệnh đề đi với 'since' chỉ hành động bắt đầu ở quá khứ kéo dài đến hiện tại cần dùng Present Perfect (have lived).",
                    },
                    {
                        type: "PREPOSITION",
                        category: "PREPOSITION",
                        wrongText: "graduate university",
                        correctText: "graduated from university",
                        explanation: "Động từ 'graduate' khi đi với trường/bậc học cần giới từ 'from' và chia quá khứ đơn trong mệnh đề sau since.",
                    },
                ],
                strengths: ["Diễn đạt đúng người và đối tượng", "Sử dụng được liên từ 'since'"],
                feedback: "Chú ý cấu trúc 'have + V3' với since và cụm 'graduate from'.",
                recommendations: ["Thực hành Thì Hiện tại hoàn thành với since/for", "Ghi nhớ giới từ đi kèm động từ"],
            },
            {
                qId: "q_004",
                userAns: "Weather today is very nice and sunny.",
                ref: "The weather today is very nice and sunny.",
                vi: "Thời tiết hôm nay rất đẹp và nhiều nắng.",
                score: 85,
                status: "partially_correct" as const,
                level: "A1",
                topic: "Daily Life",
                grammar: "Articles",
                errors: [
                    {
                        type: "ARTICLE",
                        category: "ARTICLE",
                        wrongText: "Weather",
                        correctText: "The weather",
                        explanation: "Cần mạo từ xác định 'The' trước danh từ 'weather' khi nói về thời tiết cụ thể của ngày hôm nay.",
                    },
                ],
                strengths: ["Tính từ sử dụng chính xác", "Cấu trúc câu tự nhiên"],
                feedback: "Gần như hoàn hảo, chỉ thiếu mạo từ 'The' đầu câu.",
                recommendations: ["Luyện tập các quy tắc sử dụng mạo từ The"],
            },
        ];

        sampleRecords.forEach((rec, idx) => {
            const attId = `att_sample_${idx + 1}`;
            const attempt: MemoryAttempt = {
                _id: attId,
                userId: "usr_learner_001",
                questionId: rec.qId,
                vietnameseSentence: rec.vi,
                referenceAnswer: rec.ref,
                userAnswer: rec.userAns,
                status: rec.status,
                aiScore: rec.score,
                finalScore: rec.score,
                errors: rec.errors,
                strengths: rec.strengths,
                overallFeedback: rec.feedback,
                recommendations: rec.recommendations,
                level: rec.level,
                topic: rec.topic,
                grammarTopic: rec.grammar,
                createdAt: new Date(Date.now() - (5 - idx) * 86400000),
                updatedAt: new Date(Date.now() - (5 - idx) * 86400000),
            };

            this.attempts.push(attempt);

            rec.errors.forEach((err, errIdx) => {
                this.errors.push({
                    _id: `err_sample_${idx}_${errIdx}`,
                    userId: "usr_learner_001",
                    attemptId: attId,
                    questionId: rec.qId,
                    type: err.type,
                    category: err.category,
                    wrongText: err.wrongText,
                    correctText: err.correctText,
                    explanation: err.explanation,
                    topic: rec.topic,
                    grammarTopic: rec.grammar,
                    createdAt: attempt.createdAt,
                    updatedAt: attempt.createdAt,
                });
            });
        });
    }
}

export const memoryStore = new MemoryStore();
