import {
    CefrLevel,
    DifficultyLevel,
    IEvaluationResult,
    IGeneratedQuestion,
    IWeaknessAnalysisResult,
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
}

export interface IGenerateQuestionsInput {
    level: CefrLevel;
    difficulty: DifficultyLevel;
    grammarTopics: string[];
    topicPrompt: string;
    numberOfQuestions: number;
}
