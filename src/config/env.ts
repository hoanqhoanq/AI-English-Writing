import dotenv from "dotenv";

dotenv.config();

export const config = {
    port: Number(process.env.PORT) || 5000,

    mongoUri: process.env.MONGODB_URI || "",

    jwtSecret:
        process.env.JWT_SECRET ||
        "ai_english_writing_jwt_secret_2026",

    // Short-lived access token used to call the API (sent as Bearer header).
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",

    // Long-lived refresh token secret/lifetime. The raw token is stored only in an
    // HttpOnly cookie; the server persists a hash of it in refresh_token_sessions.
    refreshTokenSecret:
        process.env.REFRESH_TOKEN_SECRET ||
        "ai_english_writing_refresh_token_secret_2026",
    refreshTokenExpiresInDays: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS) || 30,

    // Optional bootstrap for the very first admin account. If not set, no admin
    // account is auto-created — promote a user to admin manually via MongoDB or
    // an existing admin's user-management screen.
    adminBootstrapEmail: process.env.ADMIN_EMAIL || "",
    adminBootstrapPassword: process.env.ADMIN_PASSWORD || "",

    aiProvider: process.env.AI_PROVIDER || "gemini",

    geminiApiKey: process.env.GEMINI_API_KEY || "",

    geminiModel:
        process.env.GEMINI_MODEL || "gemini-3.6-flash",

    // Per-request timeout for a single Gemini generateContent() call, so a
    // hung/very-slow request can't block the caller for minutes — it aborts
    // and the model-fallback loop moves on instead. Optional to set; falls
    // back to a sensible default if the env var is absent or invalid.
    geminiRequestTimeoutMs: Number(process.env.GEMINI_REQUEST_TIMEOUT_MS) || 10000,

    // Secondary AI fallback providers, tried (in order) only after Gemini's
    // own model list is exhausted, before finally falling back to the
    // Heuristic provider. Both are optional — an empty apiKey means that
    // provider is skipped entirely (see ai.service.ts), so the app runs fine
    // with only Gemini (or only Heuristic) configured.
    groqApiKey: process.env.GROQ_API_KEY || "",
    groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-20b",

    openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
    openrouterModel: process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b",

    // Reasoning effort for Groq's gpt-oss models (low | medium | high). The
    // model's hidden reasoning tokens are billed as output and were about
    // 60% of each grading call's completion, so a lower effort directly cuts
    // token use and latency. Ignored for non-reasoning Groq models.
    groqReasoningEffort: (() => {
        const raw = (process.env.GROQ_REASONING_EFFORT || "").trim().toLowerCase();
        return raw === "low" || raw === "medium" || raw === "high" ? raw : "low";
    })(),

    // Sampling temperature for AI *grading* calls (sentence/paragraph
    // evaluation) on the OpenAI-compatible providers (Groq/OpenRouter): lower
    // means less run-to-run score variance for the same answer. Deliberately
    // NOT applied to Gemini — Google recommends leaving Gemini 3 models at
    // their default temperature (lower values can cause looping/degraded
    // reasoning). Valid range 0-2; anything else falls back to 0.2.
    aiEvaluationTemperature: (() => {
        const raw = process.env.AI_EVALUATION_TEMPERATURE;
        const value = raw === undefined || raw.trim() === "" ? NaN : Number(raw);
        return Number.isFinite(value) && value >= 0 && value <= 2 ? value : 0.2;
    })(),

    // Order in which the configured AI providers are tried, comma-separated
    // (names: gemini, groq, openrouter). Defaults to Gemini first. Providers
    // not listed are still used, appended after the listed ones in default
    // order; Heuristic always remains the final fallback regardless.
    aiProviderOrder: (process.env.AI_PRIMARY_ORDER || "gemini,groq,openrouter")
        .split(",")
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean),

    // AI Quiz Solver (upload PDF/DOCX → answers). Solving a whole quiz is a
    // much larger generation than grading one sentence, so it gets its own
    // per-call timeout instead of the 6s cap used by the grading calls, plus a
    // total deadline for the whole job (all batches/providers together).
    quizSolver: {
        maxFileMb: positiveNumber(process.env.QUIZ_SOLVER_MAX_FILE_MB, 10),
        maxPdfPages: positiveNumber(process.env.QUIZ_SOLVER_MAX_PDF_PAGES, 50),
        aiTimeoutMs: positiveNumber(process.env.QUIZ_SOLVER_AI_TIMEOUT_MS, 45000),
        // Max time on one provider (all its fallback models) before trying the
        // next provider — an overloaded Gemini can't stall the whole solve.
        providerBudgetMs: positiveNumber(process.env.QUIZ_SOLVER_PROVIDER_BUDGET_MS, 50000),
        jobTimeoutMs: positiveNumber(process.env.QUIZ_SOLVER_JOB_TIMEOUT_MS, 180000),
        // Estimated prompt tokens / questions per AI call. A quiz that fits
        // is solved in a single call; longer ones are split into batches.
        batchMaxTokens: positiveNumber(process.env.QUIZ_SOLVER_BATCH_MAX_TOKENS, 5000),
        batchMaxQuestions: positiveNumber(process.env.QUIZ_SOLVER_BATCH_MAX_QUESTIONS, 15),
        concurrency: positiveNumber(process.env.QUIZ_SOLVER_CONCURRENCY, 2),
        // Hard cap on extracted text, so one upload can't turn into an
        // unbounded number of AI calls.
        maxTextChars: positiveNumber(process.env.QUIZ_SOLVER_MAX_TEXT_CHARS, 150000),
        // How long a finished result stays in memory (re-uploading the same
        // file or refreshing the page returns it without a new AI call).
        resultTtlMs: positiveNumber(process.env.QUIZ_SOLVER_RESULT_TTL_MS, 15 * 60 * 1000),
        // Optional Gemini thinking level for quiz solving (minimal|low|medium|high).
        // Unset = the model's own default; only change it after checking accuracy.
        geminiThinkingLevel: (() => {
            const raw = (process.env.QUIZ_SOLVER_GEMINI_THINKING_LEVEL || "").trim().toLowerCase();
            return ["minimal", "low", "medium", "high"].includes(raw) ? raw : "";
        })(),
    },

    nodeEnv: process.env.NODE_ENV || "development",
};

function positiveNumber(raw: string | undefined, fallback: number): number {
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}