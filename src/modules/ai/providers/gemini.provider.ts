import { GoogleGenAI } from "@google/genai";
import { config } from "../../../config/env";
import {
    AIProvider,
    IGenerateQuestionsInput,
    IEvaluationInput,
    IParagraphEvaluationInput,
    IWeaknessAnalysisInput,
} from "../ai.interface";
import {
    CefrLevel,
    DifficultyLevel,
    IEvaluationResult,
    IGeneratedQuestion,
    IParagraphEvaluationResult,
    IWeaknessAnalysisResult,
} from "../../../types";
import { buildWritingGenerationPrompt } from "../prompts/writing-generation.prompt";
import { buildWritingEvaluationPrompt } from "../prompts/writing-evaluation.prompt";
import { buildWeaknessAnalysisPrompt } from "../prompts/weakness-analysis.prompt";
import { buildParagraphEvaluationPrompt } from "../prompts/paragraph-evaluation.prompt";
import { z } from "zod";

const CategoryAnalysisSchema = z.object({
    score: z.number().min(0).max(100),
    feedback: z.string().min(1),
});

const EvaluationSchema = z.object({
    isCorrect: z.boolean(),
    status: z.enum(["correct", "partially_correct", "incorrect"]),
    score: z.number().min(0).max(100),
    summary: z.string().min(1),
    meaningAnalysis: CategoryAnalysisSchema.extend({ correct: z.boolean() }),
    grammarAnalysis: CategoryAnalysisSchema,
    vocabularyAnalysis: CategoryAnalysisSchema,
    structureAnalysis: CategoryAnalysisSchema,
    naturalnessAnalysis: CategoryAnalysisSchema,
    errors: z.array(
        z.object({
            type: z.string(),
            category: z.string().optional(),
            severity: z.enum(["minor", "major"]).default("minor"),
            wrongText: z.string(),
            correctText: z.string(),
            explanation: z.string(),
        })
    ),
    correctAnswer: z.string(),
    alternativeAnswers: z.array(z.string()).default([]),
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    overallFeedback: z.string(),
    recommendations: z.array(z.string()).default([]),
});

const QuestionArraySchema = z.array(
    z.object({
        vietnameseSentence: z.string(),
        referenceAnswer: z.string(),
        alternativeAnswers: z.array(z.string()).default([]),
        level: z.string(),
        topic: z.string(),
        grammarTopics: z.array(z.string().min(1)).min(1),
        difficulty: z.string().default("medium"),
        keywords: z.array(z.string()).default([]),
    })
);

const GeneratedQuestionsSchema = z.object({
    questions: QuestionArraySchema,
});

const WeaknessAnalysisSchema = z.object({
    overallLevel: z.string(),
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    repeatedErrors: z.array(
        z.object({
            type: z.string(),
            category: z.string().optional(),
            frequency: z.number().default(1),
            exampleMistake: z.string().default(""),
            correction: z.string().default(""),
            advice: z.string().default(""),
        })
    ).default([]),
    progress: z.enum(["improving", "stable", "needs_attention"]).default("stable"),
    analysis: z.string(),
    recommendations: z.array(z.string()).default([]),
});

const ParagraphCriterionSchema = z.object({
    score: z.number().min(0).max(100),
    feedback: z.string().min(1),
});

const ParagraphEvaluationSchema = z.object({
    overallScore: z.number().min(0).max(100),
    meetsRequirements: z.boolean(),
    content: ParagraphCriterionSchema,
    organization: ParagraphCriterionSchema,
    coherence: ParagraphCriterionSchema,
    grammar: ParagraphCriterionSchema,
    vocabulary: ParagraphCriterionSchema,
    sentenceStructure: ParagraphCriterionSchema,
    naturalness: ParagraphCriterionSchema,
    errors: z.array(
        z.object({
            type: z.string(),
            category: z.string().optional(),
            severity: z.enum(["minor", "major"]).default("minor"),
            wrongText: z.string(),
            correctText: z.string(),
            explanation: z.string(),
        })
    ).default([]),
    strengths: z.array(z.string()).default([]),
    weaknesses: z.array(z.string()).default([]),
    correctedSuggestion: z.string(),
    overallFeedback: z.string(),
    recommendations: z.array(z.string()).default([]),
});

export class GeminiProvider implements AIProvider {
    readonly name = "gemini";
    private client: GoogleGenAI | null = null;

    private getClient(): GoogleGenAI {
        if (!this.client) {
            const key = config.geminiApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;
            if (!key) {
                throw new Error("GEMINI_API_KEY is not defined in environment variables");
            }
            this.client = new GoogleGenAI({
                apiKey: key,
                httpOptions: {
                    headers: {
                        "User-Agent": "aistudio-build",
                    },
                },
            });
        }
        return this.client;
    }

    private async generateJsonWithFallback(prompt: string): Promise<string> {
        const client = this.getClient();
        const candidateModels = [
            config.geminiModel,
            "gemini-3.6-flash",
            "gemini-flash-latest",
            "gemini-3.5-flash",
        ].filter((model, index, models) => model && models.indexOf(model) === index);
        let lastError: any = null;

        for (const model of candidateModels) {
            try {
                const response = await client.models.generateContent({
                    model,
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                    },
                });

                if (response.text) {
                    return response.text;
                }
            } catch (err: any) {
                lastError = err;
                const errStr = String(err?.message || err);
                // Retryable with a different model: temporary overload/rate-limit, or this
                // specific model being deprecated/retired/not found for the current API key.
                const isRetryableWithOtherModel =
                    errStr.includes("503") ||
                    errStr.includes("high demand") ||
                    errStr.includes("RESOURCE_EXHAUSTED") ||
                    errStr.includes("429") ||
                    errStr.includes("404") ||
                    errStr.includes("NOT_FOUND") ||
                    errStr.includes("no longer available");

                if (isRetryableWithOtherModel) {
                    console.warn(`[Gemini Provider] Model "${model}" unavailable (${errStr.slice(0, 150)}). Trying next candidate model...`);
                    await new Promise((res) => setTimeout(res, 400));
                    continue;
                }
                throw err;
            }
        }

        throw lastError || new Error("Failed to generate content with Gemini models");
    }

    private cleanJsonString(raw: string): string {
        let cleaned = raw.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.replace(/^```json\s*/, "");
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```\s*/, "");
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.replace(/\s*```$/, "");
        }
        return cleaned.trim();
    }

    async generateWritingQuestions(params: IGenerateQuestionsInput): Promise<IGeneratedQuestion[]> {
        const prompt = buildWritingGenerationPrompt(params);
        const rawText = await this.generateJsonWithFallback(prompt);

        const cleaned = this.cleanJsonString(rawText || "[]");
        const parsed = JSON.parse(cleaned);
        const validated = GeneratedQuestionsSchema.parse(parsed);

        if (validated.questions.length !== params.numberOfQuestions) {
            throw new Error(`Gemini returned ${validated.questions.length} questions, expected ${params.numberOfQuestions}`);
        }

        return validated.questions.map((q) => ({
            vietnameseSentence: q.vietnameseSentence,
            referenceAnswer: q.referenceAnswer,
            alternativeAnswers: q.alternativeAnswers,
            level: q.level as CefrLevel,
            topic: q.topic,
            grammarTopic: q.grammarTopics.join(", "),
            difficulty: q.difficulty as DifficultyLevel,
            keywords: q.keywords,
        }));
    }

    async evaluateWriting(input: IEvaluationInput): Promise<IEvaluationResult> {
        const prompt = buildWritingEvaluationPrompt(input);
        const maxAttempts = 3;
        let lastError: any = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const rawText = await this.generateJsonWithFallback(prompt);
                const cleaned = this.cleanJsonString(rawText || "{}");
                const parsed = JSON.parse(cleaned);
                const validated = EvaluationSchema.parse(parsed);

                return {
                    isCorrect: validated.isCorrect,
                    status: validated.status as any,
                    score: validated.score,
                    summary: validated.summary,
                    meaningAnalysis: validated.meaningAnalysis,
                    grammarAnalysis: validated.grammarAnalysis,
                    vocabularyAnalysis: validated.vocabularyAnalysis,
                    structureAnalysis: validated.structureAnalysis,
                    naturalnessAnalysis: validated.naturalnessAnalysis,
                    correctAnswer: validated.correctAnswer,
                    alternativeAnswers: validated.alternativeAnswers,
                    errors: validated.errors.map((e) => ({
                        type: e.type as any,
                        category: e.category,
                        severity: e.severity,
                        wrongText: e.wrongText,
                        correctText: e.correctText,
                        explanation: e.explanation,
                    })),
                    strengths: validated.strengths,
                    weaknesses: validated.weaknesses,
                    overallFeedback: validated.overallFeedback,
                    recommendations: validated.recommendations,
                    scoreBreakdown: {
                        grammar: validated.grammarAnalysis.score,
                        vocabulary: validated.vocabularyAnalysis.score,
                        meaning: validated.meaningAnalysis.score,
                        sentenceStructure: validated.structureAnalysis.score,
                        naturalness: validated.naturalnessAnalysis.score,
                    },
                };
            } catch (err: any) {
                lastError = err;
                console.warn(`[Gemini Provider] evaluateWriting attempt ${attempt}/${maxAttempts} failed to produce a valid response: ${String(err?.message || err).slice(0, 200)}`);
                if (attempt < maxAttempts) {
                    await new Promise((res) => setTimeout(res, 300));
                }
            }
        }

        throw lastError || new Error("Gemini did not return a valid evaluation after retries");
    }

    async analyzeWeakness(input: IWeaknessAnalysisInput): Promise<IWeaknessAnalysisResult> {
        const prompt = buildWeaknessAnalysisPrompt(input);
        const rawText = await this.generateJsonWithFallback(prompt);

        const cleaned = this.cleanJsonString(rawText || "{}");
        const parsed = JSON.parse(cleaned);
        const validated = WeaknessAnalysisSchema.parse(parsed);

        return {
            overallLevel: validated.overallLevel as CefrLevel,
            strengths: validated.strengths,
            weaknesses: validated.weaknesses,
            repeatedErrors: validated.repeatedErrors,
            progress: validated.progress as any,
            analysis: validated.analysis,
            recommendations: validated.recommendations,
        };
    }

    async evaluateParagraph(input: IParagraphEvaluationInput): Promise<IParagraphEvaluationResult> {
        const prompt = buildParagraphEvaluationPrompt(input);
        const maxAttempts = 3;
        let lastError: any = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const rawText = await this.generateJsonWithFallback(prompt);
                const cleaned = this.cleanJsonString(rawText || "{}");
                const parsed = JSON.parse(cleaned);
                const validated = ParagraphEvaluationSchema.parse(parsed);
                const wordCount = input.userAnswer.trim().split(/\s+/).filter(Boolean).length;

                return {
                    overallScore: validated.overallScore,
                    wordCount,
                    meetsRequirements: validated.meetsRequirements,
                    content: validated.content,
                    organization: validated.organization,
                    coherence: validated.coherence,
                    grammar: validated.grammar,
                    vocabulary: validated.vocabulary,
                    sentenceStructure: validated.sentenceStructure,
                    naturalness: validated.naturalness,
                    errors: validated.errors.map((e) => ({
                        type: e.type as any,
                        category: e.category,
                        severity: e.severity,
                        wrongText: e.wrongText,
                        correctText: e.correctText,
                        explanation: e.explanation,
                    })),
                    strengths: validated.strengths,
                    weaknesses: validated.weaknesses,
                    correctedSuggestion: validated.correctedSuggestion,
                    overallFeedback: validated.overallFeedback,
                    recommendations: validated.recommendations,
                };
            } catch (err: any) {
                lastError = err;
                console.warn(`[Gemini Provider] evaluateParagraph attempt ${attempt}/${maxAttempts} failed to produce a valid response: ${String(err?.message || err).slice(0, 200)}`);
                if (attempt < maxAttempts) {
                    await new Promise((res) => setTimeout(res, 300));
                }
            }
        }

        throw lastError || new Error("Gemini did not return a valid paragraph evaluation after retries");
    }
}
