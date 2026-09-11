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
    cefrLevel: CefrLevel;
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
