import { GoogleGenAI } from "@google/genai";
import { config } from "../../../config/env";
import {
    AIProvider,
    IGenerateQuestionsInput,
    IEvaluationInput,
    IGenerateParagraphPromptInput,
    IParagraphEvaluationInput,
    IWeaknessAnalysisInput,
    IGenerateQuizInput,
    IGeneratedQuizQuestion,
} from "../ai.interface";
import {
    CefrLevel,
    DifficultyLevel,
    IEvaluationResult,
    IGeneratedQuestion,
    IGeneratedParagraphPrompt,
    IParagraphEvaluationResult,
    IWeaknessAnalysisResult,
} from "../../../types";
import { buildWritingGenerationPrompt } from "../prompts/writing-generation.prompt";
import { buildWritingEvaluationPrompt } from "../prompts/writing-evaluation.prompt";
import { buildWeaknessAnalysisPrompt } from "../prompts/weakness-analysis.prompt";
import { buildParagraphEvaluationPrompt } from "../prompts/paragraph-evaluation.prompt";
import { buildParagraphGenerationPrompt } from "../prompts/paragraph-generation.prompt";
import { buildQuizGenerationPrompt } from "../prompts/quiz-generation.prompt";
import { z } from "zod";

const CategoryAnalysisSchema = z.object({
    score: z.number().min(0).max(100),
    feedback: z.string().min(1),
});

// Exported so other OpenAI-compatible providers (Groq, OpenRouter) can
// validate against the exact same JSON shape instead of redefining it.
export const EvaluationSchema = z.object({
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

export const GeneratedQuestionsSchema = z.object({
    questions: QuestionArraySchema,
});

export const WeaknessAnalysisSchema = z.object({
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

export const ParagraphEvaluationSchema = z.object({
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

export const GeneratedParagraphPromptSchema = z.object({
    promptVi: z.string().min(1),
    requirements: z.array(z.string()).default([]),
});

const QuizQuestionSchema = z.object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).length(4),
    correctAnswer: z.number().int().min(0).max(3),
    explanation: z.string().min(1),
    tense: z.string().min(1),
    difficulty: z.string(),
    topic: z.string(),
});

export const GeneratedQuizSchema = z.object({
    questions: z.array(QuizQuestionSchema),
});

// Vietnamese uses diacritics extensively — any genuinely Vietnamese sentence of
// normal length will contain several of these characters. An English sentence
// essentially never does. Requiring a handful of matches (not just one) avoids
// false positives from a single stray accented character.
const VIETNAMESE_DIACRITICS_REGEX =
    /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi;
const MIN_VIETNAMESE_DIACRITIC_MATCHES = 4;

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

    // Classifies a Gemini call failure so each candidate model can be handled
    // according to what actually happened, not treated identically:
    // - "quota" / "not_found" / "high_demand" / "network": none of these are
    //   fixed by waiting a few hundred ms and asking the SAME model again —
    //   quota needs the RetryInfo's 15-30s (far too long to block a request
    //   on), high-demand (503/UNAVAILABLE) in practice rarely clears within a
    //   single request's lifetime, a 404 model id will never resolve, and a
    //   network error's retry value is marginal here. Every one of these just
    //   moves on to the next candidate model with ZERO retries on this one —
    //   this is what stops a single Submit from becoming 9 real API calls.
    // - "timeout": our own client-side abort (see callGeminiWithTimeout) —
    //   same treatment, skip to the next model immediately.
    // - "fatal": anything else (bad request, auth failure, etc.) — retrying,
    //   with this model or another, will not fix it, so throw immediately
    //   instead of burning calls on the rest of the candidate list.
    private classifyGeminiError(err: any): "quota" | "not_found" | "high_demand" | "timeout" | "network" | "fatal" {
        if (err?.__isGeminiTimeout) return "timeout";
        const msg = String(err?.message || err || "");
        if (
            msg.includes("429") ||
            msg.includes("RESOURCE_EXHAUSTED") ||
            /quota/i.test(msg) ||
            /rate.?limit/i.test(msg)
        ) {
            return "quota";
        }
        if (msg.includes("404") || msg.includes("NOT_FOUND") || msg.includes("no longer available")) {
            return "not_found";
        }
        if (/\b5\d{2}\b/.test(msg) || /UNAVAILABLE/i.test(msg) || /high demand/i.test(msg)) {
            return "high_demand";
        }
        if (/ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/i.test(msg) || /network/i.test(msg)) {
            return "network";
        }
        return "fatal";
    }

    // Wraps a single generateContent() call with a hard client-side timeout
    // (config.geminiRequestTimeoutMs, default 10s) via AbortController, so a
    // hung/very-slow request can never block the caller for the 15s-170s+
    // seen in production logs — it aborts and the caller moves to the next
    // fallback model instead.
    private async callGeminiWithTimeout(
        client: GoogleGenAI,
        model: string,
        prompt: string
    ): Promise<{ text?: string }> {
        // Hard per-model cap of 6s regardless of GEMINI_REQUEST_TIMEOUT_MS, so 3
        // candidate models can never take longer than ~18s total (was up to 30s
        // at the previous 10s/model default) while still honoring a smaller
        // configured value if one is set.
        const timeoutMs = Math.min(config.geminiRequestTimeoutMs, 6000);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await client.models.generateContent({
                model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    abortSignal: controller.signal,
                },
            });
        } catch (err: any) {
            if (controller.signal.aborted) {
                const timeoutErr: any = new Error(`Gemini request to "${model}" timed out after ${timeoutMs}ms`);
                timeoutErr.__isGeminiTimeout = true;
                throw timeoutErr;
            }
            throw err;
        } finally {
            clearTimeout(timer);
        }
    }

    // Tries every candidate model in order, ONE attempt each (bounded by
    // callGeminiWithTimeout's per-request timeout) — Gemini must get a real
    // chance across all configured fallback models before this throws and the
    // caller (aiService) falls back to the Heuristic provider. This is used
    // identically by every AIProvider method (evaluateWriting/evaluateParagraph
    // included) — there is no fail-fast-after-one-model shortcut: a single
    // 503/timeout/network hiccup on one model must not take Gemini out of the
    // running for the whole request when other models may still succeed.
    // quota (429) and not_found (404) also just move to the next model — the
    // only case that aborts the whole list immediately is "fatal" (a
    // non-retryable error like bad request/auth, where no model would help).
    private async generateJsonWithFallback(prompt: string): Promise<string> {
        const client = this.getClient();
        const candidateModels = [
            config.geminiModel,
            "gemini-3.6-flash",
            "gemini-flash-latest",
            "gemini-3.5-flash",
        ].filter((model, index, models) => model && models.indexOf(model) === index);
        let lastError: any = null;

        // At most ONE attempt per candidate model — no retry loop here at all,
        // so a request is bounded by (number of models) x (per-model timeout),
        // never by repeated retries on the same already-failing model.
        for (const model of candidateModels) {
            console.log(`[Gemini Provider] Calling model "${model}"...`);
            const callStart = Date.now();
            try {
                const response = await this.callGeminiWithTimeout(client, model, prompt);
                const elapsed = Date.now() - callStart;
                if (response.text) {
                    console.log(`[Gemini Provider] Model "${model}" succeeded in ${elapsed}ms`);
                    return response.text;
                }
                lastError = new Error(`Model "${model}" returned an empty response`);
                console.warn(`[Gemini Provider] Model "${model}" returned an empty response after ${elapsed}ms — trying fallback model.`);
            } catch (err: any) {
                lastError = err;
                const elapsed = Date.now() - callStart;
                const kind = this.classifyGeminiError(err);
                const errStr = String(err?.message || err).slice(0, 150);

                if (kind === "fatal") {
                    // Switching model or retrying will not fix this — trying
                    // the rest of the candidate list would only waste calls.
                    console.warn(`[Gemini Provider] Model "${model}" failed after ${elapsed}ms with a non-retryable error (${errStr}).`);
                    throw err;
                }

                const reason =
                    kind === "timeout" ? `timed out after ${elapsed}ms` :
                    kind === "quota" ? `quota/rate-limit exhausted (${errStr})` :
                    kind === "not_found" ? `model unavailable/not found (${errStr})` :
                    kind === "high_demand" ? `high demand / overloaded (${errStr})` :
                    `network error (${errStr})`;
                console.warn(`[Gemini Provider] Model "${model}" failed after ${elapsed}ms: ${reason} — trying fallback model.`);
            }
        }

        console.warn(`[Gemini Provider] All ${candidateModels.length} candidate models failed.`);
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
        // Retries ONLY when Gemini responded but with an invalid/malformed
        // shape - NOT for connectivity/quota failures, which are handled (and
        // already given their own bounded retry budget) inside
        // generateJsonWithFallback. Retrying this whole model list again on a
        // connectivity failure would just re-hit the same exhausted models.
        const maxValidationAttempts = 3;
        let lastError: any = null;

        for (let attempt = 1; attempt <= maxValidationAttempts; attempt++) {
            let rawText: string;
            try {
                // Tries every candidate Gemini model (see generateJsonWithFallback)
                // before this throws — only THEN does the outer catch below
                // give up without retrying the validation loop, since retrying
                // here would just re-run the whole already-exhausted model list.
                rawText = await this.generateJsonWithFallback(prompt);
            } catch (err: any) {
                console.warn(`[Gemini Provider] evaluateWriting: all candidate models failed (${String(err?.message || err).slice(0, 200)}) — not retrying the model list.`);
                throw err;
            }

            try {
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
                console.warn(`[Gemini Provider] evaluateWriting attempt ${attempt}/${maxValidationAttempts} got an invalid response shape: ${String(err?.message || err).slice(0, 200)}`);
                if (attempt < maxValidationAttempts) {
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
        // See evaluateWriting() above for why this only retries on an invalid
        // response shape, not on connectivity/quota failures.
        const maxValidationAttempts = 3;
        let lastError: any = null;

        for (let attempt = 1; attempt <= maxValidationAttempts; attempt++) {
            let rawText: string;
            try {
                // Tries every candidate Gemini model before this throws — see
                // evaluateWriting() above for why the outer loop doesn't retry
                // the whole model list again after that.
                rawText = await this.generateJsonWithFallback(prompt);
            } catch (err: any) {
                console.warn(`[Gemini Provider] evaluateParagraph: all candidate models failed (${String(err?.message || err).slice(0, 200)}) — not retrying the model list.`);
                throw err;
            }

            try {
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
                console.warn(`[Gemini Provider] evaluateParagraph attempt ${attempt}/${maxValidationAttempts} got an invalid response shape: ${String(err?.message || err).slice(0, 200)}`);
                if (attempt < maxValidationAttempts) {
                    await new Promise((res) => setTimeout(res, 300));
                }
            }
        }

        throw lastError || new Error("Gemini did not return a valid paragraph evaluation after retries");
    }

    // A hard, code-level guarantee (not just a prompt instruction) that the
    // generated task text is actually Vietnamese — a failed check triggers a
    // retry with a different model attempt, same as any other invalid response.
    private looksVietnamese(text: string): boolean {
        const matches = text.match(VIETNAMESE_DIACRITICS_REGEX);
        return !!matches && matches.length >= MIN_VIETNAMESE_DIACRITIC_MATCHES;
    }

    async generateParagraphPrompt(params: IGenerateParagraphPromptInput): Promise<IGeneratedParagraphPrompt> {
        const prompt = buildParagraphGenerationPrompt(params);
        // See evaluateWriting() above for why this only retries on an invalid
        // response shape (incl. the Vietnamese-language check), not on
        // connectivity/quota failures.
        const maxValidationAttempts = 3;
        let lastError: any = null;

        for (let attempt = 1; attempt <= maxValidationAttempts; attempt++) {
            let rawText: string;
            try {
                rawText = await this.generateJsonWithFallback(prompt);
            } catch (err: any) {
                console.warn(`[Gemini Provider] generateParagraphPrompt: all candidate models failed (${String(err?.message || err).slice(0, 200)}) — not retrying the model list.`);
                throw err;
            }

            try {
                const cleaned = this.cleanJsonString(rawText || "{}");
                const parsed = JSON.parse(cleaned);
                const validated = GeneratedParagraphPromptSchema.parse(parsed);

                if (!this.looksVietnamese(validated.promptVi)) {
                    throw new Error("Generated paragraph prompt failed Vietnamese-language check (looked like English)");
                }

                return {
                    promptVi: validated.promptVi,
                    requirements: validated.requirements,
                };
            } catch (err: any) {
                lastError = err;
                console.warn(`[Gemini Provider] generateParagraphPrompt attempt ${attempt}/${maxValidationAttempts} got an invalid response: ${String(err?.message || err).slice(0, 200)}`);
                if (attempt < maxValidationAttempts) {
                    await new Promise((res) => setTimeout(res, 300));
                }
            }
        }

        throw lastError || new Error("Gemini did not return a valid paragraph prompt after retries");
    }

    async generateQuizQuestions(params: IGenerateQuizInput): Promise<IGeneratedQuizQuestion[]> {
        const prompt = buildQuizGenerationPrompt(params);
        const rawText = await this.generateJsonWithFallback(prompt);

        const cleaned = this.cleanJsonString(rawText || "{}");
        const parsed = JSON.parse(cleaned);
        const validated = GeneratedQuizSchema.parse(parsed);

        const expectedCount = params.perTenseTargets
            ? Object.values(params.perTenseTargets).reduce((sum, c) => sum + c, 0)
            : params.questionCount;
        if (validated.questions.length !== expectedCount) {
            throw new Error(
                `Gemini returned ${validated.questions.length} quiz questions, expected ${expectedCount}`
            );
        }

        // Hard, code-level guarantee (not just a prompt instruction) that no two
        // generated questions are duplicates — mirrors the looksVietnamese() check
        // above for paragraph prompts. A failure here is caught by aiService and
        // triggers the Heuristic fallback, same as any other invalid response.
        const seen = new Set<string>();
        for (const q of validated.questions) {
            const normalized = q.question.trim().toLowerCase();
            if (seen.has(normalized)) {
                throw new Error("Gemini returned duplicate quiz questions");
            }
            seen.add(normalized);
        }

        return validated.questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            tense: q.tense,
            difficulty: (q.difficulty || params.difficulty) as CefrLevel,
            topic: q.topic,
        }));
    }
}
