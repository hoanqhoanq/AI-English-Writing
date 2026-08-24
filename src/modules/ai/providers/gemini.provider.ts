import { GoogleGenAI } from "@google/genai";
import { config } from "../../../config/env";
import {
    AIProvider,
    IGenerateQuestionsInput,
    IEvaluationInput,
    IWeaknessAnalysisInput,
} from "../ai.interface";
import {
    CefrLevel,
    DifficultyLevel,
    IEvaluationResult,
    IGeneratedQuestion,
    IWeaknessAnalysisResult,
} from "../../../types";
import { buildWritingGenerationPrompt } from "../prompts/writing-generation.prompt";
import { buildWritingEvaluationPrompt } from "../prompts/writing-evaluation.prompt";
import { buildWeaknessAnalysisPrompt } from "../prompts/weakness-analysis.prompt";
import { z } from "zod";

const EvaluationSchema = z.object({
    status: z.enum(["correct", "partially_correct", "incorrect"]),
    score: z.number().min(0).max(100),
    correctAnswer: z.string(),
    errors: z.array(
        z.object({
            type: z.string(),
            category: z.string().optional(),
            wrongText: z.string(),
            correctText: z.string(),
            explanation: z.string(),
        })
    ),
    strengths: z.array(z.string()).default([]),
    overallFeedback: z.string(),
    recommendations: z.array(z.string()).default([]),
    scoreBreakdown: z
        .object({
            grammar: z.number().optional(),
            vocabulary: z.number().optional(),
            meaning: z.number().optional(),
            sentenceStructure: z.number().optional(),
            naturalness: z.number().optional(),
        })
        .optional(),
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
            "gemini-2.5-flash",
            "gemini-2.0-flash",
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
                const isOverloaded = errStr.includes("503") || errStr.includes("high demand") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429");
                
                if (isOverloaded) {
                    console.log(`[Gemini Provider] Model ${model} is experiencing high demand. Retrying with fallback model...`);
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
        const rawText = await this.generateJsonWithFallback(prompt);

        const cleaned = this.cleanJsonString(rawText || "{}");
        const parsed = JSON.parse(cleaned);
        const validated = EvaluationSchema.parse(parsed);

        return {
            status: validated.status as any,
            score: validated.score,
            correctAnswer: validated.correctAnswer,
            errors: validated.errors.map((e) => ({
                type: e.type as any,
                category: e.category,
                wrongText: e.wrongText,
                correctText: e.correctText,
                explanation: e.explanation,
            })),
            strengths: validated.strengths,
            overallFeedback: validated.overallFeedback,
            recommendations: validated.recommendations,
            scoreBreakdown: validated.scoreBreakdown
                ? {
                      grammar: validated.scoreBreakdown.grammar || validated.score,
                      vocabulary: validated.scoreBreakdown.vocabulary || validated.score,
                      meaning: validated.scoreBreakdown.meaning || validated.score,
                      sentenceStructure: validated.scoreBreakdown.sentenceStructure || validated.score,
                      naturalness: validated.scoreBreakdown.naturalness || validated.score,
                  }
                : undefined,
        };
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
}
