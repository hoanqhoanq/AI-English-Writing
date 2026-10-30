import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AIService } from "../../src/modules/ai/ai.service";
import { QuizSolverService } from "../../src/modules/quiz-solver/quiz-solver.service";
import { QuizSolverError } from "../../src/modules/quiz-solver/quiz-solver.errors";
import { config } from "../../src/config/env";
import { answerAllWithB, FakeQuizProvider, makeDocx, makePdf, SAMPLE_QUIZ_LINES } from "./fixtures";

// The real AIService (validation retry, provider chain, no Heuristic) with a
// test-layer provider — no network calls, no API cost.
const setup = (respond: ConstructorParameters<typeof FakeQuizProvider>[0]) => {
    const provider = new FakeQuizProvider(respond);
    const ai = new AIService();
    ai.setProvider(provider);
    return { provider, service: new QuizSolverService(ai) };
};

const pdfFile = (lines: string[], name = "de.pdf") => {
    const buffer = makePdf(lines);
    return { originalname: name, mimetype: "application/pdf", size: buffer.length, buffer };
};

const solve = async (service: QuizSolverService, file: ReturnType<typeof pdfFile>, userId = "u1") => {
    const started = service.startSolve(userId, file);
    return (await service.waitForJob(started.jobId))!;
};

const defaults = { ...config.quizSolver };
beforeEach(() => Object.assign(config.quizSolver, defaults));

test("solves a short quiz in ONE AI call, in order, with option text and timings", async () => {
    const { provider, service } = setup((prompt) => answerAllWithB(prompt));
    const job = await solve(service, pdfFile(SAMPLE_QUIZ_LINES));
    assert.equal(job.status, "completed");
    assert.equal(provider.calls.length, 1);
    const r = job.result!;
    assert.deepEqual(r.questions.map((q) => q.number), [1, 2]);
    assert.equal(r.questions[0].answer, "B");
    assert.equal(r.questions[0].answerText, "goes");
    assert.equal(r.questions[1].answerText, "played");
    assert.equal(r.summary.answered, 2);
    assert.equal(r.parseMode, "structured");
    for (const key of ["extractionMs", "parsingMs", "aiMs", "finalizeMs", "totalMs"] as const) {
        assert.equal(typeof r.timings[key], "number");
    }
    // The prompt carries the shared instruction once and both questions.
    assert.match(provider.calls[0], /\[CONTEXT C1\]\nChoose the correct answer\./);
    assert.match(provider.calls[0], /Q2 \[context C1\]: They _____ football yesterday\./);
});

test("missing data → unanswerable (no invented answer); unknown letter → needs review", async () => {
    const { service } = setup(() =>
        JSON.stringify({
            answers: [
                { number: 1, answer: null, explanation: "Câu hỏi cần hình ảnh không có trong đề.", confidence: "low", needsReview: true },
                { number: 2, answer: "F", explanation: "?", confidence: "high", needsReview: false },
            ],
        })
    );
    const r = (await solve(service, pdfFile(SAMPLE_QUIZ_LINES))).result!;
    assert.equal(r.questions[0].status, "unanswerable");
    assert.equal(r.questions[0].answer, null);
    assert.equal(r.questions[0].needsReview, true);
    assert.equal(r.questions[1].needsReview, true);
    assert.equal(r.questions[1].answerText, null);
    assert.equal(r.summary.needsReview, 2);
});

test("invalid JSON is retried once, then succeeds", async () => {
    const { provider, service } = setup((prompt, call) => (call === 1 ? "{not json" : answerAllWithB(prompt)));
    const job = await solve(service, pdfFile(SAMPLE_QUIZ_LINES));
    assert.equal(job.status, "completed");
    assert.equal(provider.calls.length, 2);
});

test("always-invalid JSON fails in a bounded number of calls with a controlled error", async () => {
    const { provider, service } = setup(() => '{"wrong": true}');
    const job = await solve(service, pdfFile(SAMPLE_QUIZ_LINES));
    assert.equal(job.status, "failed");
    assert.equal(job.error!.code, "AI_INVALID_RESPONSE");
    assert.equal(provider.calls.length, 2);
});

test("AI timeout and rate limit map to controlled Vietnamese errors", async () => {
    const timeout = setup(() => {
        throw new Error('Gemini request to "x" timed out after 60000ms');
    });
    const t = await solve(timeout.service, pdfFile(SAMPLE_QUIZ_LINES));
    assert.equal(t.error!.code, "AI_TIMEOUT");
    assert.equal(timeout.provider.calls.length, 1, "connectivity errors are not retried on the same provider");

    const limited = setup(() => {
        throw new Error("groq request failed with 429: rate limit");
    });
    const l = await solve(limited.service, pdfFile(SAMPLE_QUIZ_LINES));
    assert.equal(l.error!.code, "AI_RATE_LIMIT");
    assert.match(l.error!.message, /thử lại/);
});

test("passes the quiz-solver timeout and a deadline to the provider", async () => {
    config.quizSolver.aiTimeoutMs = 12345;
    const { provider, service } = setup((prompt, _call, options) => {
        assert.equal(options.timeoutMs, 12345);
        assert.ok(options.deadline! > Date.now());
        return answerAllWithB(prompt);
    });
    assert.equal((await solve(service, pdfFile(SAMPLE_QUIZ_LINES))).status, "completed");
    assert.equal(provider.calls.length, 1);
});

test("an overloaded first provider is abandoned within its time budget and the next provider answers", async () => {
    config.quizSolver.providerBudgetMs = 5000;
    const overloaded = new FakeQuizProvider((_prompt, _call, options) => {
        assert.ok(options.deadline! - Date.now() <= 5000, "provider deadline is capped by its budget");
        throw new Error("gemini 503 UNAVAILABLE high demand");
    });
    const healthy = new FakeQuizProvider((prompt) => answerAllWithB(prompt));
    const ai = new AIService();
    (ai as any).providers = [overloaded, healthy];
    const job = await solve(new QuizSolverService(ai), pdfFile(SAMPLE_QUIZ_LINES));
    assert.equal(job.status, "completed");
    assert.equal(overloaded.calls.length, 1);
    assert.equal(healthy.calls.length, 1);
});

test("no real AI provider → AI_CONFIG, never Heuristic answers", async () => {
    const ai = new AIService();
    (ai as any).providers = [];
    const service = new QuizSolverService(ai);
    const job = await solve(service, pdfFile(SAMPLE_QUIZ_LINES));
    assert.equal(job.status, "failed");
    assert.equal(job.error!.code, "AI_CONFIG");
});

test("one failed batch keeps the other batches' answers (partial result)", async () => {
    config.quizSolver.batchMaxQuestions = 1;
    const { service } = setup((prompt) => {
        if (/^Q2/m.test(prompt)) throw new Error("gemini 503 UNAVAILABLE");
        return answerAllWithB(prompt);
    });
    const job = await solve(service, pdfFile(SAMPLE_QUIZ_LINES));
    assert.equal(job.status, "completed");
    const r = job.result!;
    assert.equal(r.questions[0].answer, "B");
    assert.equal(r.questions[1].status, "failed");
    assert.equal(r.summary.failed, 1);
    assert.deepEqual(r.batches, { total: 2, failed: 1 });
    assert.ok(r.warnings.some((w) => w.includes("chưa giải được")));
});

test("answers skipped by the AI get exactly one follow-up call for just those questions", async () => {
    const { provider, service } = setup((prompt, call) => {
        if (call === 1) return JSON.stringify({ answers: [{ number: 1, answer: "B", explanation: "x", confidence: "high" }] });
        return answerAllWithB(prompt);
    });
    const r = (await solve(service, pdfFile(SAMPLE_QUIZ_LINES))).result!;
    assert.equal(provider.calls.length, 2);
    assert.match(provider.calls[1], /Question numbers to answer: 2\n/);
    assert.equal(r.questions[1].answer, "B");
});

test("long quiz: batches with bounded concurrency, merged back in the original order", async () => {
    config.quizSolver.batchMaxQuestions = 10;
    config.quizSolver.concurrency = 2;
    let inFlight = 0;
    let maxInFlight = 0;
    const { provider, service } = setup(async (prompt) => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        // Later batches answer faster, so completion order != document order.
        const first = Number(/^Q(\d+)/m.exec(prompt)![1]);
        await new Promise((r) => setTimeout(r, 40 - first / 2));
        inFlight--;
        return answerAllWithB(prompt);
    });
    const lines: string[] = [];
    // One line per question so all 45 fit on the single fixture page.
    for (let i = 1; i <= 45; i++) lines.push(`${i}. Question ${i} _____ ? A. a B. b C. c D. d`);
    const job = await solve(service, pdfFile(lines));
    assert.equal(job.status, "completed");
    assert.equal(provider.calls.length, 5);
    assert.ok(maxInFlight <= 2, `max in-flight ${maxInFlight}`);
    assert.deepEqual(job.result!.questions.map((q) => q.sourceNumber), Array.from({ length: 45 }, (_, i) => i + 1));
    assert.ok(job.result!.questions.every((q) => q.answerText === "b"));
});

test("same file again (in progress or finished) reuses the job — no second AI call", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const { provider, service } = setup(async (prompt) => {
        await gate;
        return answerAllWithB(prompt);
    });
    const file = pdfFile(SAMPLE_QUIZ_LINES);
    const first = service.startSolve("u1", file);
    const second = service.startSolve("u1", file);
    assert.equal(second.jobId, first.jobId);
    assert.equal(second.reused, true);

    // A different file while one is in progress is refused.
    assert.throws(
        () => service.startSolve("u1", pdfFile(["1. Other?", "A. x B. y"])),
        (err: any) => err instanceof QuizSolverError && err.code === "JOB_IN_PROGRESS"
    );

    release();
    await service.waitForJob(first.jobId);
    const third = service.startSolve("u1", file);
    assert.equal(third.jobId, first.jobId);
    assert.equal(third.status, "completed");
    assert.equal(provider.calls.length, 1);
});

test("a job is only visible to its owner", async () => {
    const { service } = setup((prompt) => answerAllWithB(prompt));
    const started = service.startSolve("owner", pdfFile(SAMPLE_QUIZ_LINES));
    assert.ok(service.getJob("owner", started.jobId));
    assert.equal(service.getJob("someone-else", started.jobId), null);
    assert.equal(service.getJob("owner", "does-not-exist"), null);
    await service.waitForJob(started.jobId);
});

test("no question numbering → one detect-and-solve call, flagged with a warning", async () => {
    const { provider, service } = setup(() =>
        JSON.stringify({
            questions: [
                { number: 1, question: "She _____ to school.", options: [{ label: "A", text: "go" }, { label: "B", text: "goes" }], answer: "B", explanation: "x", confidence: "high" },
            ],
        })
    );
    const job = await solve(service, pdfFile(["She _____ to school every day, go or goes?"]));
    assert.equal(job.status, "completed");
    assert.equal(provider.calls.length, 1);
    assert.equal(job.result!.parseMode, "ai_detected");
    assert.equal(job.result!.questions[0].answerText, "goes");
    assert.ok(job.result!.warnings.some((w) => w.includes("AI đã tự xác định")));
});

test("DOCX end-to-end with automatic numbering", async () => {
    const { service } = setup((prompt) => answerAllWithB(prompt));
    const buffer = await makeDocx([
        { text: "She _____ to school.", numId: 1 },
        { text: "go", numId: 1, ilvl: 1 },
        { text: "goes", numId: 1, ilvl: 1 },
    ]);
    const started = service.startSolve("u1", { originalname: "de.docx", mimetype: "", size: buffer.length, buffer });
    const job = (await service.waitForJob(started.jobId))!;
    assert.equal(job.status, "completed");
    assert.equal(job.result!.questions[0].answerText, "goes");
    assert.equal(job.result!.fileType, "docx");
});

test("scanned PDF fails before any AI call", async () => {
    const { provider, service } = setup((prompt) => answerAllWithB(prompt));
    const job = await solve(service, pdfFile([]));
    assert.equal(job.error!.code, "SCANNED_PDF");
    assert.equal(provider.calls.length, 0);
});
