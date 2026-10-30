import crypto from "crypto";
import { config } from "../../config/env";
import { aiService, AIService } from "../ai/ai.service";
import { buildQuizDetectAndSolvePrompt, buildQuizSolveBatchPrompt } from "../ai/prompts/quiz-solver.prompt";
import { detectQuizFileType, extractQuizText, QuizFileType, safeDisplayName, UploadedQuizFile } from "./quiz-file.service";
import {
    buildQuizBatches,
    estimateTokens,
    formatContextForPrompt,
    formatQuestionForPrompt,
    normalizeQuizText,
    ParsedQuestion,
    parseQuizQuestions,
    QuizBatch,
    QuizOption,
} from "./quiz-question.parser";
import { AISolvedAnswer, parseDetectedQuiz, parseSolvedBatch, QuizSolverResult, SolvedQuestion } from "./quiz-solver.schema";
import { QuizSolverError, toAIError } from "./quiz-solver.errors";

export type QuizSolverStage = "extracting" | "parsing" | "solving" | "finalizing" | "done";
export type QuizSolverStatus = "processing" | "completed" | "failed";

interface QuizSolverJob {
    id: string;
    userId: string;
    dedupKey: string;
    fileName: string;
    status: QuizSolverStatus;
    stage: QuizSolverStage;
    progress: { completedBatches: number; totalBatches: number };
    result?: QuizSolverResult;
    error?: { code: string; message: string };
    createdAt: number;
    updatedAt: number;
}

export interface QuizSolverJobView {
    jobId: string;
    status: QuizSolverStatus;
    stage: QuizSolverStage;
    progress: { completedBatches: number; totalBatches: number };
    fileName: string;
    reused: boolean;
    result?: QuizSolverResult;
    error?: { code: string; message: string };
}

interface BatchOutcome {
    answers: Map<number, AISolvedAnswer>;
    providers: string[];
    error?: QuizSolverError;
}

// Upper bound on finished jobs kept in memory, whatever their TTL.
const MAX_STORED_JOBS = 500;

const mapWithConcurrency = async <T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> => {
    const results: R[] = new Array(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(Math.max(1, limit), items.length) }, async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await fn(items[index]);
        }
    });
    await Promise.all(workers);
    return results;
};

// Maps an AI answer onto an option label: "B", "b", "(B)", "B. goes" or the
// option's own text. Returns null when it matches no option.
const matchOption = (options: QuizOption[], answer: string): QuizOption | null => {
    const letter = /^\(?([A-Ha-h])(?:[.)]|\s|$)/.exec(answer.trim())?.[1]?.toUpperCase();
    if (letter) {
        const byLabel = options.find((o) => o.label === letter);
        if (byLabel) return byLabel;
    }
    const norm = (s: string) => s.toLowerCase().replace(/[\s.]+/g, " ").trim();
    return options.find((o) => norm(o.text) === norm(answer)) ?? null;
};

export const buildSolvedQuestion = (q: ParsedQuestion, a: AISolvedAnswer | undefined): SolvedQuestion => {
    const base = {
        number: q.number,
        sourceNumber: q.sourceNumber,
        contextId: q.contextId,
        question: q.question,
        options: q.options,
    };
    if (!a) {
        return {
            ...base,
            answer: null,
            answerText: null,
            alternatives: [],
            explanation: "Chưa nhận được đáp án từ AI cho câu này. Vui lòng thử phân tích lại.",
            confidence: "low",
            needsReview: true,
            status: "failed",
        };
    }
    if (a.answer === null) {
        return {
            ...base,
            answer: null,
            answerText: null,
            alternatives: [],
            explanation: a.explanation || "Không đủ dữ liệu để xác định đáp án (có thể thiếu hình ảnh hoặc nội dung).",
            confidence: "low",
            needsReview: true,
            status: "unanswerable",
        };
    }

    let needsReview = a.needsReview || a.confidence === "low";
    let explanation = a.explanation;
    if (q.options.length > 0) {
        const option = matchOption(q.options, a.answer);
        const alternatives = a.alternatives
            .map((alt) => matchOption(q.options, alt)?.label ?? alt)
            .filter((alt) => alt !== option?.label);
        if (!option) {
            needsReview = true;
            explanation = `${explanation} (Đáp án AI đưa ra không khớp với lựa chọn nào — cần kiểm tra lại.)`.trim();
        }
        return {
            ...base,
            answer: option ? option.label : a.answer,
            answerText: option ? option.text : null,
            alternatives,
            explanation,
            confidence: option ? a.confidence : "low",
            needsReview,
            status: "solved",
        };
    }
    return {
        ...base,
        answer: a.answer,
        answerText: a.answer,
        alternatives: a.alternatives,
        explanation,
        confidence: a.confidence,
        needsReview,
        status: "solved",
    };
};

export class QuizSolverService {
    private jobs = new Map<string, QuizSolverJob>();
    private jobIdByKey = new Map<string, string>();

    // The AI dependency is injectable so tests can exercise the real
    // orchestration with a stubbed provider — production uses aiService.
    constructor(private ai: Pick<AIService, "generateValidatedJson"> = aiService) {}

    // Validates the upload synchronously (invalid files fail the request
    // itself, before any job exists), then starts solving in the background.
    // The same user uploading the same file again gets the existing job —
    // in progress or finished — instead of a second AI run.
    startSolve(userId: string, file: UploadedQuizFile): QuizSolverJobView {
        const type = detectQuizFileType(file);
        this.sweep();

        const hash = crypto.createHash("sha256").update(file.buffer).digest("hex");
        const dedupKey = `${userId}:${hash}`;
        const existingId = this.jobIdByKey.get(dedupKey);
        const existing = existingId ? this.jobs.get(existingId) : undefined;
        if (existing && (existing.status === "processing" || (existing.status === "completed" && existing.result?.summary.failed === 0))) {
            return this.toView(existing, true);
        }

        for (const job of this.jobs.values()) {
            if (job.userId === userId && job.status === "processing") {
                throw new QuizSolverError(
                    "JOB_IN_PROGRESS",
                    "Bạn đang có một đề khác đang được phân tích. Vui lòng chờ hoàn tất rồi thử lại.",
                    429
                );
            }
        }

        const now = Date.now();
        const job: QuizSolverJob = {
            id: crypto.randomUUID(),
            userId,
            dedupKey,
            fileName: safeDisplayName(file.originalname),
            status: "processing",
            stage: "extracting",
            progress: { completedBatches: 0, totalBatches: 0 },
            createdAt: now,
            updatedAt: now,
        };
        this.jobs.set(job.id, job);
        this.jobIdByKey.set(dedupKey, job.id);

        const holder: { buffer: Buffer | null } = { buffer: file.buffer };
        void this.run(job, holder, type);
        return this.toView(job, false);
    }

    getJob(userId: string, jobId: string): QuizSolverJobView | null {
        this.sweep();
        const job = this.jobs.get(jobId);
        // Another user's job is reported exactly like a missing one.
        if (!job || job.userId !== userId) return null;
        return this.toView(job, false);
    }

    // Resolves once the job is no longer processing (used by tests).
    async waitForJob(jobId: string, timeoutMs = 10000): Promise<QuizSolverJobView | null> {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            const job = this.jobs.get(jobId);
            if (!job) return null;
            if (job.status !== "processing") return this.toView(job, false);
            await new Promise((r) => setTimeout(r, 10));
        }
        const job = this.jobs.get(jobId);
        return job ? this.toView(job, false) : null;
    }

    private toView(job: QuizSolverJob, reused: boolean): QuizSolverJobView {
        return {
            jobId: job.id,
            status: job.status,
            stage: job.stage,
            progress: { ...job.progress },
            fileName: job.fileName,
            reused,
            ...(job.result ? { result: job.result } : {}),
            ...(job.error ? { error: job.error } : {}),
        };
    }

    private setStage(job: QuizSolverJob, stage: QuizSolverStage) {
        job.stage = stage;
        job.updatedAt = Date.now();
    }

    private sweep() {
        const now = Date.now();
        const ttl = config.quizSolver.resultTtlMs;
        for (const [id, job] of this.jobs) {
            const expired = job.status !== "processing" && now - job.updatedAt > ttl;
            // A job can't legitimately stay "processing" much past its deadline.
            const stuck = job.status === "processing" && now - job.createdAt > config.quizSolver.jobTimeoutMs * 2;
            if (expired || stuck) this.deleteJob(id);
        }
        if (this.jobs.size > MAX_STORED_JOBS) {
            const finished = [...this.jobs.values()].filter((j) => j.status !== "processing").sort((a, b) => a.updatedAt - b.updatedAt);
            for (const job of finished.slice(0, this.jobs.size - MAX_STORED_JOBS)) this.deleteJob(job.id);
        }
    }

    private deleteJob(id: string) {
        const job = this.jobs.get(id);
        if (!job) return;
        this.jobs.delete(id);
        if (this.jobIdByKey.get(job.dedupKey) === id) this.jobIdByKey.delete(job.dedupKey);
    }

    private async run(job: QuizSolverJob, holder: { buffer: Buffer | null }, type: QuizFileType): Promise<void> {
        const started = Date.now();
        const deadline = started + config.quizSolver.jobTimeoutMs;
        const tag = `[QUIZ SOLVER] job ${job.id.slice(0, 8)}`;
        try {
            // 1. Extract — the uploaded bytes are only held in memory (never
            // written to disk) and released as soon as the text is out.
            this.setStage(job, "extracting");
            const extracted = await extractQuizText(holder.buffer!, type);
            holder.buffer = null;
            const extractionDone = Date.now();

            // 2. Normalize + parse in code.
            this.setStage(job, "parsing");
            const text = normalizeQuizText(extracted.text);
            if (text.length > config.quizSolver.maxTextChars) {
                throw new QuizSolverError(
                    "TEXT_TOO_LONG",
                    "Đề quá dài để xử lý trong một lần. Vui lòng chia đề thành các file nhỏ hơn.",
                    422
                );
            }
            const parsed = parseQuizQuestions(text);
            const warnings = [...extracted.warnings, ...parsed.warnings];
            const parsingDone = Date.now();

            // 3. Solve.
            this.setStage(job, "solving");
            let questions: SolvedQuestion[];
            let parseMode: QuizSolverResult["parseMode"] = "structured";
            let providers: string[] = [];
            let batchStats = { total: 0, failed: 0 };
            let firstError: QuizSolverError | undefined;

            if (parsed.questions.length === 0) {
                // No numbering found: let the model identify the questions,
                // but only for a text short enough for one call.
                if (estimateTokens(text) > config.quizSolver.batchMaxTokens * 1.5) {
                    throw new QuizSolverError(
                        "NO_QUESTIONS",
                        "Không nhận diện được câu hỏi trong đề. Hãy đánh số câu hỏi (ví dụ \"1.\", \"Câu 1:\") và đáp án (A., B., C., D.) rồi tải lại.",
                        422
                    );
                }
                parseMode = "ai_detected";
                job.progress = { completedBatches: 0, totalBatches: 1 };
                batchStats.total = 1;
                const { result, providerName } = await this.ai
                    .generateValidatedJson(buildQuizDetectAndSolvePrompt(text), (raw) => parseDetectedQuiz(raw), this.aiOptions(deadline))
                    .catch((err) => {
                        throw toAIError(err);
                    });
                providers = [providerName];
                questions = result.map((d, i) => {
                    const q: ParsedQuestion = { number: i + 1, sourceNumber: d.number, contextId: null, question: d.question, options: d.options.map((o) => ({ label: o.label.toUpperCase(), text: o.text })) };
                    return buildSolvedQuestion(q, { ...d, number: i + 1 });
                });
                job.progress.completedBatches = 1;
                warnings.push("Không nhận diện được cấu trúc đánh số câu hỏi; AI đã tự xác định câu hỏi — hãy đối chiếu lại với đề gốc.");
            } else {
                const batches = buildQuizBatches(parsed, {
                    maxTokens: config.quizSolver.batchMaxTokens,
                    maxQuestions: config.quizSolver.batchMaxQuestions,
                });
                job.progress = { completedBatches: 0, totalBatches: batches.length };
                const outcomes = await mapWithConcurrency(batches, config.quizSolver.concurrency, async (batch) => {
                    const outcome = await this.solveBatch(batch, deadline);
                    job.progress.completedBatches++;
                    job.updatedAt = Date.now();
                    return outcome;
                });

                const answers = new Map<number, AISolvedAnswer>();
                for (const outcome of outcomes) {
                    outcome.answers.forEach((a, n) => answers.set(n, a));
                    providers.push(...outcome.providers);
                    if (outcome.error) {
                        batchStats.failed++;
                        firstError = firstError ?? outcome.error;
                    }
                }
                batchStats.total = batches.length;
                if (answers.size === 0) throw firstError ?? new QuizSolverError("AI_FAILED", "Không thể giải đề bằng AI lúc này. Vui lòng thử lại sau.", 502);
                questions = parsed.questions.map((q) => buildSolvedQuestion(q, answers.get(q.number)));
            }
            const aiDone = Date.now();

            // 4. Finalize.
            this.setStage(job, "finalizing");
            const failed = questions.filter((q) => q.status === "failed").length;
            if (failed > 0) {
                warnings.push(`${failed} câu chưa giải được do lỗi AI${firstError ? ` (${firstError.message})` : ""}. Bạn có thể tải lại đề để thử lại.`);
            }
            if (questions.some((q) => /\b(picture|image|photo|chart|graph|map|listen|audio)\b|hình|tranh|ảnh/i.test(q.question))) {
                warnings.push("Một số câu có vẻ cần hình ảnh/âm thanh — hãy kiểm tra kỹ các câu được đánh dấu cần xem lại.");
            }
            const finished = Date.now();
            const result: QuizSolverResult = {
                fileName: job.fileName,
                fileType: type,
                parseMode,
                questions,
                contexts: parsed.contexts,
                warnings,
                summary: {
                    total: questions.length,
                    answered: questions.filter((q) => q.answer !== null).length,
                    needsReview: questions.filter((q) => q.needsReview).length,
                    failed,
                },
                batches: batchStats,
                providers: [...new Set(providers)],
                timings: {
                    extractionMs: extractionDone - started,
                    parsingMs: parsingDone - extractionDone,
                    aiMs: aiDone - parsingDone,
                    finalizeMs: finished - aiDone,
                    totalMs: finished - started,
                },
            };
            job.result = result;
            job.status = "completed";
            this.setStage(job, "done");
            console.log(
                `${tag} completed: ${result.summary.total} questions, ${batchStats.total} batch(es) (${batchStats.failed} failed), ` +
                    `providers=${result.providers.join(",") || "-"} | extraction=${result.timings.extractionMs}ms parsing=${result.timings.parsingMs}ms ` +
                    `ai=${result.timings.aiMs}ms finalize=${result.timings.finalizeMs}ms total=${result.timings.totalMs}ms`
            );
        } catch (err: any) {
            holder.buffer = null;
            const controlled = err instanceof QuizSolverError ? err : new QuizSolverError("INTERNAL", "Đã xảy ra lỗi khi xử lý đề. Vui lòng thử lại.", 500);
            if (!(err instanceof QuizSolverError)) console.error(`${tag} unexpected error:`, err?.name, String(err?.message || "").slice(0, 200));
            job.status = "failed";
            job.error = { code: controlled.code, message: controlled.message };
            job.updatedAt = Date.now();
            console.warn(`${tag} failed after ${Date.now() - started}ms: ${controlled.code}`);
        }
    }

    private aiOptions(deadline: number) {
        return {
            timeoutMs: config.quizSolver.aiTimeoutMs,
            deadline,
            providerBudgetMs: config.quizSolver.providerBudgetMs,
            temperature: 0,
            ...(config.quizSolver.geminiThinkingLevel ? { thinkingLevel: config.quizSolver.geminiThinkingLevel } : {}),
        };
    }

    // One AI call per batch. If the response skips a few questions, ONE
    // follow-up call asks for just those; a batch-level failure is returned
    // (not thrown) so the other batches' answers are still delivered.
    private async solveBatch(batch: QuizBatch, deadline: number): Promise<BatchOutcome> {
        const callFor = (questions: ParsedQuestion[]) => {
            const contextIds = new Set(questions.map((q) => q.contextId));
            const numbers = questions.map((q) => q.number);
            const prompt = buildQuizSolveBatchPrompt({
                contextBlocks: batch.contexts.filter((c) => contextIds.has(c.id)).map(formatContextForPrompt),
                questionBlocks: questions.map(formatQuestionForPrompt),
                numbers,
            });
            return this.ai.generateValidatedJson(prompt, (raw) => parseSolvedBatch(raw, numbers), this.aiOptions(deadline));
        };

        try {
            const first = await callFor(batch.questions);
            const answers = first.result;
            const providers = [first.providerName];
            const missing = batch.questions.filter((q) => !answers.has(q.number));
            if (missing.length > 0) {
                try {
                    const followUp = await callFor(missing);
                    followUp.result.forEach((a, n) => answers.set(n, a));
                    providers.push(followUp.providerName);
                } catch (err: any) {
                    console.warn(`[QUIZ SOLVER] follow-up call for ${missing.length} missing answer(s) failed: ${toAIError(err).code}`);
                }
            }
            return { answers, providers };
        } catch (err: any) {
            const error = toAIError(err);
            console.warn(`[QUIZ SOLVER] batch of ${batch.questions.length} question(s) failed: ${error.code}`);
            return { answers: new Map(), providers: [], error };
        }
    }
}

export const quizSolverService = new QuizSolverService();
