import {
    AIProvider,
    IGenerateQuestionsInput,
    IEvaluationInput,
    IGenerateParagraphPromptInput,
    IParagraphEvaluationInput,
    IWeaknessAnalysisInput,
    IGenerateQuizInput,
    IGeneratedQuizQuestion,
    IRawJsonOptions,
} from "./ai.interface";
import { GeminiProvider } from "./providers/gemini.provider";
import { GroqProvider } from "./providers/groq.provider";
import { OpenRouterProvider } from "./providers/openrouter.provider";
import { HeuristicProvider } from "./providers/heuristic.provider";
import { config } from "../../config/env";
import {
    CefrLevel,
    DifficultyLevel,
    IEvaluationResult,
    IGeneratedQuestion,
    IGeneratedParagraphPrompt,
    IParagraphEvaluationResult,
    IWeaknessAnalysisResult,
} from "../../types";

export class AIService {
    // Ordered chain of real AI providers, tried in sequence. Default order is
    // Gemini → Groq → OpenRouter (each only if configured); AI_PRIMARY_ORDER
    // can reorder it. Each is attempted at most once per request — see
    // runWithFallback(). Heuristic is always the final, non-optional fallback
    // and is never part of this list.
    private providers: AIProvider[];
    private fallbackProvider: AIProvider;

    constructor() {
        this.fallbackProvider = new HeuristicProvider();

        const available: Record<string, AIProvider> = {};
        if (config.aiProvider === "gemini" && (config.geminiApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY)) {
            available.gemini = new GeminiProvider();
        } else {
            console.warn("[AI Service] GEMINI_API_KEY not configured. Gemini will be skipped.");
        }
        if (config.groqApiKey) {
            available.groq = new GroqProvider();
        }
        if (config.openrouterApiKey) {
            available.openrouter = new OpenRouterProvider();
        }

        // AI_PRIMARY_ORDER only reorders the providers that are actually
        // configured above (it never enables one that has no key). Names not
        // listed are appended in the default order so none is silently lost.
        const defaultOrder = ["gemini", "groq", "openrouter"];
        const requested = config.aiProviderOrder.filter((name) => {
            if (!defaultOrder.includes(name)) {
                console.warn(`[AI Service] Ignoring unknown provider "${name}" in AI_PRIMARY_ORDER (valid: ${defaultOrder.join(", ")}).`);
                return false;
            }
            return true;
        });
        const order = [...new Set([...requested, ...defaultOrder])];
        const providers = order.filter((name) => available[name]).map((name) => available[name]);

        if (providers.length === 0) {
            console.warn("[AI Service] No AI provider configured (Gemini/Groq/OpenRouter). Using Heuristic Rule Engine Provider only.");
        } else {
            console.log(`[AI Service] AI provider order: ${providers.map((p) => p.name).join(" → ")} → heuristic_fallback`);
        }
        this.providers = providers;
    }

    // Overrides the whole provider chain (used by tests/mocks) — replaces it
    // with just the given provider, Heuristic remains the final fallback.
    public setProvider(provider: AIProvider): void {
        this.providers = [provider];
    }

    // Tries each configured provider in order, at most once each — no retry
    // of a provider that already failed, no parallel calls. Only after every
    // configured provider has failed does this fall back to Heuristic.
    private async runWithFallback<T>(
        fn: (provider: AIProvider) => Promise<T>
    ): Promise<{ result: T; providerName: string }> {
        let lastError: any = null;

        for (const provider of this.providers) {
            console.log(`[AI SERVICE] Trying provider: ${provider.name}`);
            try {
                const result = await fn(provider);
                console.log(`[AI SERVICE] Provider ${provider.name} succeeded`);
                return { result, providerName: provider.name };
            } catch (error: any) {
                lastError = error;
                console.warn(`[AI SERVICE] Provider ${provider.name} failed: ${error.message}`);
            }
        }

        console.warn(`[AI SERVICE] All providers failed${lastError ? ` (${lastError.message})` : ""}. Falling back to heuristic.`);
        const result = await fn(this.fallbackProvider);
        return { result, providerName: this.fallbackProvider.name };
    }

    async generateQuestions(params: IGenerateQuestionsInput): Promise<IGeneratedQuestion[]> {
        const startTime = Date.now();
        console.log(`[AI SERVICE] Generating questions for level=${params.level}, topic=${params.topicPrompt}`);

        const { result, providerName } = await this.runWithFallback((provider) => provider.generateWritingQuestions(params));
        console.log(`[AI SERVICE] Generated ${result.length} questions in ${Date.now() - startTime}ms (Provider: ${providerName})`);
        return result;
    }

    async evaluateWriting(input: IEvaluationInput): Promise<IEvaluationResult> {
        const startTime = Date.now();
        console.log(`[AI SERVICE] Evaluating sentence: "${input.vietnameseSentence}" | User: "${input.userAnswer}"`);

        const { result, providerName } = await this.runWithFallback((provider) => provider.evaluateWriting(input));
        // Heuristic has its own fixed scoring — only real AI scores are reconciled.
        const score = providerName === this.fallbackProvider.name ? result.score : this.reconcileScoreWithCriteria(result);
        console.log(`[AI SERVICE] Evaluation complete. Score: ${score}, Status: ${result.status} in ${Date.now() - startTime}ms`);
        console.log(`[AI SERVICE] Evaluation provider: ${providerName}`);
        return { ...result, score, provider: providerName };
    }

    // The AI returns an overall score and five per-criterion scores
    // independently, and they were seen to disagree (e.g. overall 55 while the
    // weighted criteria came to 14.5). This ties the overall to the criteria
    // using the documented weights — Grammar 40 / Vocabulary 20 / Meaning 20 /
    // Structure 10 / Naturalness 10 — but never raises it above the AI's own
    // overall, so a penalty for something outside the five criteria (e.g. a
    // spelling slip, where every criterion can still be 100) is kept.
    private reconcileScoreWithCriteria(result: IEvaluationResult): number {
        const b = result.scoreBreakdown;
        const weighted = Math.round(
            b.grammar * 0.4 + b.vocabulary * 0.2 + b.meaning * 0.2 + b.sentenceStructure * 0.1 + b.naturalness * 0.1
        );
        const reconciled = Math.min(result.score, weighted);
        if (reconciled !== result.score) {
            console.log(`[AI SERVICE] Overall score ${result.score} -> ${reconciled} (capped by weighted criteria score ${weighted})`);
        }
        return reconciled;
    }

    async analyzeWeakness(input: IWeaknessAnalysisInput): Promise<IWeaknessAnalysisResult> {
        const startTime = Date.now();
        console.log(`[AI SERVICE] Analyzing weaknesses for user with ${input.totalAttempts} attempts...`);

        const { result } = await this.runWithFallback((provider) => provider.analyzeWeakness(input));
        console.log(`[AI SERVICE] Weakness analysis complete in ${Date.now() - startTime}ms`);
        return result;
    }

    async evaluateParagraph(input: IParagraphEvaluationInput): Promise<IParagraphEvaluationResult> {
        const startTime = Date.now();
        console.log(`[AI SERVICE] Evaluating paragraph (levelTier=${input.levelTier}, words=${input.userAnswer.trim().split(/\s+/).filter(Boolean).length})`);

        const { result, providerName } = await this.runWithFallback((provider) => provider.evaluateParagraph(input));
        console.log(`[AI SERVICE] Paragraph evaluation complete. Score: ${result.overallScore} in ${Date.now() - startTime}ms`);
        console.log(`[AI SERVICE] Evaluation provider: ${providerName}`);
        return { ...result, provider: providerName };
    }

    async generateParagraphPrompt(params: IGenerateParagraphPromptInput): Promise<IGeneratedParagraphPrompt> {
        const startTime = Date.now();
        console.log(`[AI SERVICE] Generating paragraph prompt for topic=${params.topic}, difficulty=${params.difficulty}`);

        const { result, providerName } = await this.runWithFallback((provider) => provider.generateParagraphPrompt(params));
        console.log(`[AI SERVICE] Paragraph prompt generated in ${Date.now() - startTime}ms (Provider: ${providerName})`);
        return result;
    }

    // Raw-JSON generation for features that must NEVER receive rule-generated
    // content (AI Quiz Solver): same provider order as runWithFallback(), but
    // with no Heuristic fallback — if every real provider fails, this throws.
    // `parse` validates the raw text; an invalid response is retried on the
    // same provider (bounded by maxValidationAttempts), while connectivity /
    // quota / timeout errors move straight on to the next provider (each
    // provider already applies its own model fallback — no extra retry layer).
    async generateValidatedJson<T>(
        prompt: string,
        parse: (raw: string) => T,
        // providerBudgetMs: max time spent on ONE provider (all its models and
        // validation attempts) before moving on — so an overloaded provider
        // can't use up the whole deadline while the next one is healthy.
        options: IRawJsonOptions & { maxValidationAttempts?: number; providerBudgetMs?: number }
    ): Promise<{ result: T; providerName: string }> {
        const providers = this.providers.filter((p) => typeof p.generateJson === "function");
        if (providers.length === 0) {
            const err: any = new Error("No AI provider configured for raw JSON generation");
            err.__noAIProvider = true;
            throw err;
        }

        const maxValidationAttempts = options.maxValidationAttempts ?? 2;
        let lastError: any = null;

        for (const provider of providers) {
            const budgetDeadline = options.providerBudgetMs !== undefined ? Date.now() + options.providerBudgetMs : undefined;
            const deadline =
                budgetDeadline !== undefined && options.deadline !== undefined
                    ? Math.min(budgetDeadline, options.deadline)
                    : budgetDeadline ?? options.deadline;
            for (let attempt = 1; attempt <= maxValidationAttempts; attempt++) {
                if (options.deadline !== undefined && Date.now() >= options.deadline) {
                    throw lastError || new Error("AI request timed out (deadline reached)");
                }
                if (deadline !== undefined && Date.now() >= deadline) break;
                let raw: string;
                try {
                    raw = await provider.generateJson!(prompt, { ...options, deadline });
                } catch (error: any) {
                    lastError = error;
                    console.warn(`[AI SERVICE] generateValidatedJson: provider ${provider.name} failed: ${String(error?.message || error).slice(0, 200)}`);
                    break;
                }
                try {
                    return { result: parse(raw), providerName: provider.name };
                } catch (error: any) {
                    lastError = error;
                    lastError.__isValidationError = true;
                    console.warn(`[AI SERVICE] generateValidatedJson: provider ${provider.name} attempt ${attempt}/${maxValidationAttempts} returned an invalid response: ${String(error?.message || error).slice(0, 200)}`);
                }
            }
        }

        throw lastError || new Error("All AI providers failed");
    }

    async generateQuiz(params: IGenerateQuizInput): Promise<IGeneratedQuizQuestion[]> {
        const startTime = Date.now();
        console.log(`[AI SERVICE] Generating quiz: difficulty=${params.difficulty}, grammar=${params.grammarTopics.join(", ")}, count=${params.questionCount}`);

        const { result, providerName } = await this.runWithFallback((provider) => provider.generateQuizQuestions(params));
        console.log(`[AI SERVICE] Generated ${result.length} quiz questions in ${Date.now() - startTime}ms (Provider: ${providerName})`);
        return result.map((r) => ({ ...r, provider: providerName }));
    }
}

export const aiService = new AIService();
