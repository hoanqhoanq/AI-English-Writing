import {
    CefrLevel,
    DifficultyLevel,
    IEvaluationResult,
    IGeneratedQuestion,
    IGeneratedParagraphPrompt,
    IParagraphEvaluationResult,
    IWeaknessAnalysisResult,
    ParagraphLevelTier,
} from "../../types";

export interface IEvaluationInput {
    vietnameseSentence: string;
    referenceAnswer: string;
    alternativeAnswers?: string[];
    userAnswer: string;
    level: string;
    topic?: string;
    grammarTopic?: string;
}

export interface IParagraphEvaluationInput {
    instruction: string;
    levelTier: ParagraphLevelTier;
    minWords: number;
    maxWords: number;
    requirements?: string[];
    userAnswer: string;
}

export interface IGenerateParagraphPromptInput {
    topic: string;
    difficulty: "easy" | "medium" | "hard";
    levelTier: ParagraphLevelTier;
    minWords: number;
    maxWords: number;
    // Optional: recent prompts to avoid repeating (used by "Tạo đề khác").
    excludePrompts?: string[];
}

export interface IWeaknessAnalysisInput {
    overallLevel: CefrLevel;
    totalAttempts: number;
    averageScore: number;
    totalErrors: number;
    errorTypeCounts: Record<string, number>;
    grammarErrorCounts: Record<string, number>;
    topicPerformance: Record<string, { total: number; avgScore: number }>;
    recentMistakes: {
        vietnamese: string;
        userAnswer: string;
        correctAnswer: string;
        errors: { type: string; wrongText: string; correctText: string; explanation: string }[];
    }[];
}

export interface AIProvider {
    readonly name: string;

    generateWritingQuestions(
        params: IGenerateQuestionsInput
    ): Promise<IGeneratedQuestion[]>;

    evaluateWriting(input: IEvaluationInput): Promise<IEvaluationResult>;

    analyzeWeakness(input: IWeaknessAnalysisInput): Promise<IWeaknessAnalysisResult>;

    evaluateParagraph(input: IParagraphEvaluationInput): Promise<IParagraphEvaluationResult>;

    generateParagraphPrompt(params: IGenerateParagraphPromptInput): Promise<IGeneratedParagraphPrompt>;

    generateQuizQuestions(params: IGenerateQuizInput): Promise<IGeneratedQuizQuestion[]>;
}

export interface IGenerateQuestionsInput {
    level: CefrLevel;
    difficulty: DifficultyLevel;
    grammarTopics: string[];
    topicPrompt: string;
    numberOfQuestions: number;
    // Optional: recent prompts to avoid repeating (used by AI Writing's "Thử đề khác").
    excludePrompts?: string[];
}

export interface IGenerateQuizInput {
    difficulty: CefrLevel;
    // One or more tense titles (e.g. "Present Simple") the quiz should cover.
    grammarTopics: string[];
    // Human-readable topic label, or a generic multi-topic instruction when the
    // user picked "All" in the Grammar Quiz config screen.
    topic: string;
    questionCount: number;
    // Optional explicit per-tense question counts (tense title -> count),
    // summing to questionCount. When present, the prompt renders this exact
    // breakdown instead of leaving distribution to the model. Used for both
    // the initial batch and top-up/regeneration rounds (where counts are the
    // still-missing amounts per tense).
    perTenseTargets?: Record<string, number>;
    // Question texts already accepted in a previous round of the same quiz
    // generation — only set on regeneration/top-up calls, so the model knows
    // not to repeat or reword them.
    excludeQuestions?: string[];
}

export interface IGeneratedQuizQuestion {
    question: string;
    // Exactly 4 items.
    options: string[];
    // Index (0-3) into `options`.
    correctAnswer: number;
    explanation: string;
    tense: string;
    difficulty: CefrLevel;
    topic: string;
    // Which AIProvider produced this question ("gemini" or
    // "heuristic_fallback") — set by ai.service.ts, used by quiz.service.ts to
    // relax near-duplicate filtering for the intentionally-small Heuristic
    // fallback template pool.
    provider?: string;
}
