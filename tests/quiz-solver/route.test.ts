import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { AddressInfo } from "net";
import { Server } from "http";
import app from "../../src/app";
import { memoryStore } from "../../src/db/memoryStore";
import { signToken } from "../../src/utils/jwt";
import { aiService } from "../../src/modules/ai/ai.service";
import { config } from "../../src/config/env";
import { answerAllWithB, FakeQuizProvider, makePdf, SAMPLE_QUIZ_LINES } from "./fixtures";

let server: Server;
let base = "";
const provider = new FakeQuizProvider((prompt) => answerAllWithB(prompt));

const addUser = (id: string) => {
    memoryStore.users.push({
        _id: id, name: id, email: `${id}@test.local`, password: "x", role: "user", dailyGoal: 1, streak: 0,
        totalWriting: 0, averageScore: 0, isActive: true, createdAt: new Date(), updatedAt: new Date(),
    });
    return signToken({ id, email: `${id}@test.local`, role: "user", name: id });
};

let tokenA = "";
let tokenB = "";

before(async () => {
    // Test layer only: the real aiService singleton with a stub provider.
    aiService.setProvider(provider);
    tokenA = addUser("route-user-a");
    tokenB = addUser("route-user-b");
    server = app.listen(0);
    await new Promise((r) => server.once("listening", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

const upload = (token: string | null, name: string, bytes: Buffer, type = "") => {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(bytes)], { type }), name);
    return fetch(`${base}/api/quiz-solver/solve`, {
        method: "POST",
        body: form,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
};

const getJob = (token: string, jobId: string) =>
    fetch(`${base}/api/quiz-solver/jobs/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });

test("requires login", async () => {
    const res = await upload(null, "de.pdf", makePdf(SAMPLE_QUIZ_LINES), "application/pdf");
    assert.equal(res.status, 401);
    assert.equal((await fetch(`${base}/api/quiz-solver/config`)).status, 401);
});

test("rejects unsupported, spoofed, empty and oversized uploads with Vietnamese messages", async () => {
    const txt = await upload(tokenA, "notes.txt", Buffer.from("hello"), "text/plain");
    assert.equal(txt.status, 415);
    assert.match((await txt.json()).message, /PDF/);

    const spoofed = await upload(tokenA, "image.pdf", Buffer.from("\x89PNG\r\n\x1a\n", "latin1"), "application/pdf");
    assert.equal(spoofed.status, 415);

    const empty = await upload(tokenA, "empty.pdf", Buffer.alloc(0), "application/pdf");
    assert.equal(empty.status, 400);

    const big = Buffer.alloc(Math.round(config.quizSolver.maxFileMb * 1024 * 1024) + 10);
    big.write("%PDF-1.4");
    const tooBig = await upload(tokenA, "big.pdf", big, "application/pdf");
    assert.equal(tooBig.status, 413);
    const body = await tooBig.json();
    assert.equal(body.success, false);
    assert.equal(body.errors[0].code, "FILE_TOO_LARGE");
    assert.ok(!JSON.stringify(body).includes("at "), "no stack trace in the response");
});

test("upload → 202 job → poll → result; another user cannot read it", async () => {
    const res = await upload(tokenA, "de.pdf", makePdf(SAMPLE_QUIZ_LINES), "application/pdf");
    assert.equal(res.status, 202);
    const { data } = await res.json();
    assert.equal(data.status, "processing");

    let job: any = data;
    for (let i = 0; i < 100 && job.status === "processing"; i++) {
        await new Promise((r) => setTimeout(r, 20));
        job = (await (await getJob(tokenA, data.jobId)).json()).data;
    }
    assert.equal(job.status, "completed");
    assert.deepEqual(job.result.questions.map((q: any) => `${q.number}${q.answer}`), ["1B", "2B"]);

    assert.equal((await getJob(tokenB, data.jobId)).status, 404);

    // Same file again → existing result, no new AI call.
    const callsBefore = provider.calls.length;
    const again = await upload(tokenA, "de.pdf", makePdf(SAMPLE_QUIZ_LINES), "application/pdf");
    assert.equal(again.status, 200);
    assert.equal((await again.json()).data.reused, true);
    assert.equal(provider.calls.length, callsBefore);
});

test("config endpoint exposes the size limit", async () => {
    const res = await fetch(`${base}/api/quiz-solver/config`, { headers: { Authorization: `Bearer ${tokenA}` } });
    assert.equal((await res.json()).data.maxFileMb, config.quizSolver.maxFileMb);
});

test("regression: existing routes still behave the same", async () => {
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
    assert.equal((await fetch(`${base}/health`)).status, 200);
    // Existing AI / quiz / writing endpoints still require auth exactly as before.
    assert.equal((await fetch(`${base}/api/ai/evaluate-writing`, { method: "POST" })).status, 401);
    assert.equal((await fetch(`${base}/api/quiz/history`)).status, 401);
    assert.equal((await fetch(`${base}/api/analytics/me`)).status !== 500, true);
    // Auth endpoints are still mounted (validation error, not 404).
    const login = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    assert.notEqual(login.status, 404);
});
