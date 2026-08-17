export type UserRole = "user" | "admin";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type LearningTarget =
    | "General English"
    | "TOEIC"
    | "IELTS"
    | "Communication"
    | "Academic English";

export type DifficultyLevel = "easy" | "medium" | "hard";

export type SessionStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export type AttemptStatus = "correct" | "partially_correct" | "incorrect";

export type ErrorType =
    | "GRAMMAR"
    | "VOCABULARY"
    | "SPELLING"
    | "WORD_CHOICE"
    | "WORD_ORDER"
    | "MISSING_WORD"
    | "EXTRA_WORD"
    | "COLLOCATION"
    | "ARTICLE"
    | "PREPOSITION"
    | "TENSE"
    | "SUBJECT_VERB_AGREEMENT"
    | "SENTENCE_STRUCTURE"
    | "NATURALNESS";

export interface IErrorDetail {
    type: ErrorType;
    category?: string;
    wrongText: string;
    correctText: string;
    explanation: string;
}

export interface IEvaluationResult {
    status: AttemptStatus;
    score: number;
    correctAnswer: string;
    errors: IErrorDetail[];
    strengths: string[];
    overallFeedback: string;
    recommendations: string[];
    scoreBreakdown?: {
        grammar: number;
        vocabulary: number;
        meaning: number;
        sentenceStructure: number;
        naturalness: number;
    };
}

export interface IGeneratedQuestion {
    vietnameseSentence: string;
    referenceAnswer: string;
    alternativeAnswers: string[];
    level: CefrLevel;
    topic: string;
    grammarTopic: string;
    difficulty: DifficultyLevel;
    keywords: string[];
}

export interface IWeaknessAnalysisResult {
    overallLevel: CefrLevel;
    strengths: string[];
    weaknesses: string[];
    repeatedErrors: {
        type: string;
        category?: string;
        frequency: number;
        exampleMistake: string;
        correction: string;
        advice: string;
    }[];
    progress: "improving" | "stable" | "needs_attention";
    analysis: string;
    recommendations: string[];
}
