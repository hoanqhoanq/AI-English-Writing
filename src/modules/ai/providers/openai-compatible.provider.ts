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
import {
    EvaluationSchema,
    GeneratedQuestionsSchema,
    WeaknessAnalysisSchema,
    ParagraphEvaluationSchema,
    GeneratedParagraphPromptSchema,
    GeneratedQuizSchema,
} from "./gemini.provider";

// Same check used by GeminiProvider — a hard, code-level guarantee (not just
// a prompt instruction) that generated task text is actually Vietnamese.
const VIETNAMESE_DIACRITICS_REGEX =
    /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/gi;
const MIN_VIETNAMESE_DIACRITIC_MATCHES = 4;

// Shared base for any OpenAI-compatible chat-completions provider (Groq,
// OpenRouter, ...). It reuses the EXACT same prompt builders and Zod schemas
// as GeminiProvider so the fallback chain in ai.service.ts is a drop-in
// swap: only the HTTP transport (baseURL/apiKey/model) differs per subclass.
export abstract class OpenAICompatibleProvider implements AIProvider {
    readonly name: string;
    private readonly baseURL: string;
    private readonly apiKey: string;
    private readonly model: string;
    // Provider-specific request fields (e.g. Groq's reasoning_effort).
    private readonly extraBody: Record<string, unknown>;

    constructor(opts: { name: string; baseURL: string; apiKey: string; model: string; extraBody?: Record<string, unknown> }) {
        this.name = opts.name;
        this.baseURL = opts.baseURL;
        this.apiKey = opts.apiKey;
        this.model = opts.model;
        this.extraBody = opts.extraBody ?? {};
    }

    // Single attempt, hard-capped at 6s (same ceiling as GeminiProvider's
    // per-model timeout) via AbortController. Throws immediately on any
    // connectivity/HTTP failure — no retry here, so a request is bounded by
    // exactly one call per provider in the ai.service.ts fallback chain.
    private async callChatJson(prompt: string, temperature?: number): Promise<string> {
        if (!this.apiKey) {
            throw new Error(`${this.name} API key is not configured`);
        }
        const timeoutMs = Math.min(config.geminiRequestTimeoutMs, 6000);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const start = Date.now();
        try {
            console.log(`[${this.name} Provider] Calling model "${this.model}"...`);
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                // JSON mode stays on: measured against Groq gpt-oss-20b, dropping
                // it produced malformed JSON (unescaped quotes) in 2 of 6 calls,
                // whereas JSON mode produced none. Its one downside is that Groq
                // sometimes rejects a bad generation itself with a 400
                // json_validate_failed — flagged below so the validation retry
                // treats it as a bad generation, not a connectivity failure.
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" },
                    ...(temperature !== undefined ? { temperature } : {}),
                    ...this.extraBody,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const bodyText = await response.text().catch(() => "");
                const httpErr: any = new Error(`${this.name} request failed with ${response.status}: ${bodyText.slice(0, 300)}`);
                httpErr.__isJsonValidateFailed = response.status === 400 && bodyText.includes("json_validate_failed");
                throw httpErr;
            }

            const data: any = await response.json();
            const content = data?.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error(`${this.name} returned an empty response`);
            }
            const elapsed = Date.now() - start;
            // Token usage per call, so the cost of each AI feature is visible
            // in the server log (Groq's free tier is capped at 8000 tokens/min).
            const usage = data?.usage;
            const reasoning = usage?.completion_tokens_details?.reasoning_tokens;
            const tokens = usage
                ? ` | tokens: prompt=${usage.prompt_tokens} completion=${usage.completion_tokens}${reasoning !== undefined ? ` (reasoning=${reasoning})` : ""}`
                : "";
            console.log(`[${this.name} Provider] Model "${this.model}" succeeded in ${elapsed}ms${tokens}`);
            return content;
        } catch (err: any) {
            const elapsed = Date.now() - start;
            if (controller.signal.aborted) {
                const timeoutErr = new Error(`${this.name} request to "${this.model}" timed out after ${timeoutMs}ms`);
                console.warn(`[${this.name} Provider] Model "${this.model}" failed after ${elapsed}ms: timed out — trying fallback provider.`);
                throw timeoutErr;
            }
            const next = err?.__isJsonValidateFailed ? "provider rejected its own output as invalid JSON" : "trying fallback provider";
            console.warn(`[${this.name} Provider] Model "${this.model}" failed after ${elapsed}ms: ${String(err?.message || err).slice(0, 200)} — ${next}.`);
            throw err;
        } finally {
            clearTimeout(timer);
        }
    }

    // For the methods that have a validation-retry loop: if the provider
    // itself rejected its generation as invalid JSON (Groq's 400
    // json_validate_failed), return "" so the loop's JSON.parse fails and the
    // attempt is retried like any other malformed response. Every other
    // failure (429/503/timeout/network/...) still throws immediately so the
    // ai.service.ts chain moves on to the next provider — no connectivity retry.
    private async callChatJsonForValidationLoop(prompt: string, temperature?: number): Promise<string> {
        try {
            return await this.callChatJson(prompt, temperature);
        } catch (err: any) {
            if (err?.__isJsonValidateFailed) {
                return "";
            }
            throw err;
        }
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

    private looksVietnamese(text: string): boolean {
        const matches = text.match(VIETNAMESE_DIACRITICS_REGEX);
        return !!matches && matches.length >= MIN_VIETNAMESE_DIACRITIC_MATCHES;
    }

    async generateWritingQuestions(params: IGenerateQuestionsInput): Promise<IGeneratedQuestion[]> {
        const prompt = buildWritingGenerationPrompt(params);
        const rawText = await this.callChatJson(prompt);

        const cleaned = this.cleanJsonString(rawText);
        const parsed = JSON.parse(cleaned);
        const validated = GeneratedQuestionsSchema.parse(parsed);

        if (validated.questions.length !== params.numberOfQuestions) {
            throw new Error(`${this.name} returned ${validated.questions.length} questions, expected ${params.numberOfQuestions}`);
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

    // Mirrors GeminiProvider.evaluateWriting(): connectivity/HTTP failures
    // (from callChatJson) are NOT retried here — they propagate immediately
    // so ai.service.ts's chain moves to the next provider. Only an
    // invalid/malformed JSON shape triggers a retry, up to 3 attempts.
    async evaluateWriting(input: IEvaluationInput): Promise<IEvaluationResult> {
        const prompt = buildWritingEvaluationPrompt(input);
        const maxValidationAttempts = 3;
        let lastError: any = null;

        for (let attempt = 1; attempt <= maxValidationAttempts; attempt++) {
            const rawText = await this.callChatJsonForValidationLoop(prompt, config.aiEvaluationTemperature);

            try {
                const cleaned = this.cleanJsonString(rawText);
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
                console.warn(`[${this.name} Provider] evaluateWriting attempt ${attempt}/${maxValidationAttempts} got an invalid response shape: ${String(err?.message || err).slice(0, 200)}`);
                if (attempt < maxValidationAttempts) {
                    await new Promise((res) => setTimeout(res, 300));
                }
            }
        }

        throw lastError || new Error(`${this.name} did not return a valid evaluation after retries`);
    }

    async analyzeWeakness(input: IWeaknessAnalysisInput): Promise<IWeaknessAnalysisResult> {
        const prompt = buildWeaknessAnalysisPrompt(input);
        const rawText = await this.callChatJson(prompt);

        const cleaned = this.cleanJsonString(rawText);
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

    // See evaluateWriting() above for why only invalid-shape (not
    // connectivity) failures are retried, up to 3 attempts.
    async evaluateParagraph(input: IParagraphEvaluationInput): Promise<IParagraphEvaluationResult> {
        const prompt = buildParagraphEvaluationPrompt(input);
        const maxValidationAttempts = 3;
        let lastError: any = null;

        for (let attempt = 1; attempt <= maxValidationAttempts; attempt++) {
            const rawText = await this.callChatJsonForValidationLoop(prompt, config.aiEvaluationTemperature);

            try {
                const cleaned = this.cleanJsonString(rawText);
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
                console.warn(`[${this.name} Provider] evaluateParagraph attempt ${attempt}/${maxValidationAttempts} got an invalid response shape: ${String(err?.message || err).slice(0, 200)}`);
                if (attempt < maxValidationAttempts) {
                    await new Promise((res) => setTimeout(res, 300));
                }
            }
        }

        throw lastError || new Error(`${this.name} did not return a valid paragraph evaluation after retries`);
    }

    // See evaluateWriting() above for why only invalid-shape (incl. the
    // Vietnamese-language check) failures are retried, up to 3 attempts.
    async generateParagraphPrompt(params: IGenerateParagraphPromptInput): Promise<IGeneratedParagraphPrompt> {
        const prompt = buildParagraphGenerationPrompt(params);
        const maxValidationAttempts = 3;
        let lastError: any = null;

        for (let attempt = 1; attempt <= maxValidationAttempts; attempt++) {
            const rawText = await this.callChatJsonForValidationLoop(prompt);

            try {
                const cleaned = this.cleanJsonString(rawText);
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
                console.warn(`[${this.name} Provider] generateParagraphPrompt attempt ${attempt}/${maxValidationAttempts} got an invalid response: ${String(err?.message || err).slice(0, 200)}`);
                if (attempt < maxValidationAttempts) {
                    await new Promise((res) => setTimeout(res, 300));
                }
            }
        }

        throw lastError || new Error(`${this.name} did not return a valid paragraph prompt after retries`);
    }

    async generateQuizQuestions(params: IGenerateQuizInput): Promise<IGeneratedQuizQuestion[]> {
        const prompt = buildQuizGenerationPrompt(params);
        const rawText = await this.callChatJson(prompt);

        const cleaned = this.cleanJsonString(rawText);
        const parsed = JSON.parse(cleaned);
        const validated = GeneratedQuizSchema.parse(parsed);

        const expectedCount = params.perTenseTargets
            ? Object.values(params.perTenseTargets).reduce((sum, c) => sum + c, 0)
            : params.questionCount;
        if (validated.questions.length !== expectedCount) {
            throw new Error(`${this.name} returned ${validated.questions.length} quiz questions, expected ${expectedCount}`);
        }

        const seen = new Set<string>();
        for (const q of validated.questions) {
            const normalized = q.question.trim().toLowerCase();
            if (seen.has(normalized)) {
                throw new Error(`${this.name} returned duplicate quiz questions`);
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
