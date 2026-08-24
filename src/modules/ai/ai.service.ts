import { AIProvider, IGenerateQuestionsInput, IEvaluationInput, IWeaknessAnalysisInput } from "./ai.interface";
import { GeminiProvider } from "./providers/gemini.provider";
import { HeuristicProvider } from "./providers/heuristic.provider";
import { config } from "../../config/env";
import {
    CefrLevel,
    DifficultyLevel,
    IEvaluationResult,
    IGeneratedQuestion,
    IWeaknessAnalysisResult,
} from "../../types";

export class AIService {
    private provider: AIProvider;
    private fallbackProvider: AIProvider;

    constructor() {
        this.fallbackProvider = new HeuristicProvider();
        if (config.aiProvider === "gemini" && (config.geminiApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY)) {
            this.provider = new GeminiProvider();
        } else {
            console.warn("[AI Service] GEMINI_API_KEY not configured. Defaulting to Heuristic Rule Engine Provider.");
            this.provider = this.fallbackProvider;
        }
    }

    public setProvider(provider: AIProvider): void {
        this.provider = provider;
    }

    async generateQuestions(params: IGenerateQuestionsInput): Promise<IGeneratedQuestion[]> {
        const startTime = Date.now();
        console.log(`[AI SERVICE] Generating questions for level=${params.level}, topic=${params.topicPrompt}`);

        try {
            const results = await this.provider.generateWritingQuestions(params);
            console.log(`[AI SERVICE] Generated ${results.length} questions in ${Date.now() - startTime}ms (Provider: ${this.provider.name})`);
            return results;
        } catch (error: any) {
            console.warn(`[AI SERVICE] Primary provider error (${error.message}). Falling back to heuristic generator.`);
            const fallbackResults = await this.fallbackProvider.generateWritingQuestions(params);
            console.warn(`[AI SERVICE] Generated ${fallbackResults.length} questions with fallback provider.`);
            return fallbackResults;
        }
    }

    async evaluateWriting(input: IEvaluationInput): Promise<IEvaluationResult> {
        const startTime = Date.now();
        console.log(`[AI SERVICE] Evaluating sentence: "${input.vietnameseSentence}" | User: "${input.userAnswer}"`);

        try {
            const result = await this.provider.evaluateWriting(input);
            console.log(`[AI SERVICE] Evaluation complete. Score: ${result.score}, Status: ${result.status} in ${Date.now() - startTime}ms`);
            return result;
        } catch (error: any) {
            console.warn(`[AI SERVICE] Primary provider error (${error.message}). Falling back to heuristic evaluation.`);
            const fallbackResult = await this.fallbackProvider.evaluateWriting(input);
            return fallbackResult;
        }
    }

    async analyzeWeakness(input: IWeaknessAnalysisInput): Promise<IWeaknessAnalysisResult> {
        const startTime = Date.now();
        console.log(`[AI SERVICE] Analyzing weaknesses for user with ${input.totalAttempts} attempts...`);

        try {
            const result = await this.provider.analyzeWeakness(input);
            console.log(`[AI SERVICE] Weakness analysis complete in ${Date.now() - startTime}ms`);
            return result;
        } catch (error: any) {
            console.warn(`[AI SERVICE] Primary provider error (${error.message}). Falling back to heuristic weakness analysis.`);
            const fallbackResult = await this.fallbackProvider.analyzeWeakness(input);
            return fallbackResult;
        }
    }
}

export const aiService = new AIService();
