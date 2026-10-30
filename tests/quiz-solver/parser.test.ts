import { test } from "node:test";
import assert from "node:assert/strict";
import {
    buildQuizBatches,
    normalizeQuizText,
    parseQuizQuestions,
} from "../../src/modules/quiz-solver/quiz-question.parser";

test("normalize: collapses whitespace, drops page artefacts, keeps bare numbers", () => {
    const text = normalizeQuizText("Hello   world\r\n\r\n\r\n\r\nPage 2 of 5\n-- 1 of 3 --\n12\n\tLine");
    assert.equal(text, "Hello world\n\n12\nLine");
});

test("parses inline and multi-line options, keeps question order", () => {
    const quiz = parseQuizQuestions(
        normalizeQuizText(
            [
                "Choose the correct answer.",
                "1. She _____ to school every day.",
                "A. go B. goes C. going D. gone",
                "2. They _____ football yesterday.",
                "A) play",
                "B) played",
                "C) playing",
                "D) plays",
                "Câu 3: I have lived here _____ 2010.",
                "(A) for (B) since (C) in (D) at",
            ].join("\n")
        )
    );
    assert.deepEqual(quiz.questions.map((q) => q.number), [1, 2, 3]);
    assert.equal(quiz.questions[0].question, "She _____ to school every day.");
    assert.deepEqual(quiz.questions[0].options, [
        { label: "A", text: "go" },
        { label: "B", text: "goes" },
        { label: "C", text: "going" },
        { label: "D", text: "gone" },
    ]);
    assert.deepEqual(quiz.questions[1].options.map((o) => o.text), ["play", "played", "playing", "plays"]);
    assert.deepEqual(quiz.questions[2].options.map((o) => o.text), ["for", "since", "in", "at"]);
    // Preamble instruction becomes a shared context.
    assert.equal(quiz.contexts[0].text, "Choose the correct answer.");
    assert.ok(quiz.questions.every((q) => q.contextId === "C1"));
});

test("lowercase options and open questions without options", () => {
    const quiz = parseQuizQuestions(
        normalizeQuizText(["1. Choose: a. cat b. dog c. bird", "2. Rewrite: She is tall. -> She has ...", "3. Fill in: I ___ (be) a student."].join("\n"))
    );
    assert.deepEqual(quiz.questions[0].options.map((o) => o.label), ["A", "B", "C"]);
    assert.equal(quiz.questions[1].options.length, 0);
    assert.equal(quiz.questions[2].question, "Fill in: I ___ (be) a student.");
});

test("dialogue speakers 'A:' / 'B:' are not options", () => {
    const quiz = parseQuizQuestions("1. A: How are you? B: _____\nA. Fine, thanks. B. Yes, I do. C. No. D. Goodbye.");
    assert.equal(quiz.questions[0].question, "A: How are you? B: _____");
    assert.equal(quiz.questions[0].options.length, 4);
});

test("reading passage after a question becomes the context of the next questions (with range)", () => {
    const quiz = parseQuizQuestions(
        normalizeQuizText(
            [
                "1. He _____ a doctor.",
                "A. is B. are C. am D. be",
                "Read the passage and answer questions 2-3.",
                "Tom lives in London. He works in a bank.",
                "2. Where does Tom live?",
                "A. Paris B. London C. Rome D. Tokyo",
                "3. Where does he work?",
                "A. bank B. school C. shop D. hospital",
                "4. Year numbers like 2019 should not break parsing.",
                "A. ok B. fine",
            ].join("\n")
        )
    );
    assert.equal(quiz.questions.length, 4);
    // Option D of Q1 does not swallow the passage.
    assert.equal(quiz.questions[0].options[3].text, "be");
    const passage = quiz.contexts.find((c) => c.text.includes("Tom lives in London"))!;
    assert.ok(passage);
    assert.equal(quiz.questions[1].contextId, passage.id);
    assert.equal(quiz.questions[2].contextId, passage.id);
    // Range "questions 2-3" → Q4 is outside the passage.
    assert.equal(quiz.questions[3].contextId, null);
});

test("out-of-sequence numbers inside text are not question starts; restarts at 1 are", () => {
    const quiz = parseQuizQuestions(
        ["1. First question?", "A. x B. y", "1990. was a year", "2. Second?", "A. x B. y", "Part 2", "1. Third?", "A. x B. y"].join("\n")
    );
    assert.deepEqual(quiz.questions.map((q) => q.sourceNumber), [1, 2, 1]);
    assert.deepEqual(quiz.questions.map((q) => q.number), [1, 2, 3]);
});

test("no numbered questions → empty result (caller decides on fallback)", () => {
    const quiz = parseQuizQuestions("Just a paragraph of text without any question numbers.");
    assert.equal(quiz.questions.length, 0);
});

const makeLongQuiz = (count: number) =>
    parseQuizQuestions(
        Array.from({ length: count }, (_, i) => `${i + 1}. Question number ${i + 1} with some words _____ here.\nA. one B. two C. three D. four`).join("\n")
    );

test("short quiz is solved in a single batch", () => {
    const batches = buildQuizBatches(makeLongQuiz(20), { maxTokens: 5000, maxQuestions: 30 });
    assert.equal(batches.length, 1);
    assert.equal(batches[0].questions.length, 20);
});

test("long quiz is split into batches by question count and tokens, order preserved", () => {
    const quiz = makeLongQuiz(70);
    const byCount = buildQuizBatches(quiz, { maxTokens: 100000, maxQuestions: 30 });
    assert.deepEqual(byCount.map((b) => b.questions.length), [30, 30, 10]);
    const byTokens = buildQuizBatches(quiz, { maxTokens: 400, maxQuestions: 100 });
    assert.ok(byTokens.length > 1);
    assert.ok(byTokens.every((b) => b.estimatedTokens <= 400));
    const order = byTokens.flatMap((b) => b.questions.map((q) => q.number));
    assert.deepEqual(order, Array.from({ length: 70 }, (_, i) => i + 1));
});

test("a shared passage is repeated in every batch that needs it, and a group is not split when it fits", () => {
    const lines = ["1. Q one?", "A. a B. b", "Read the passage.", "PASSAGE ".repeat(50)];
    for (let n = 2; n <= 7; n++) lines.push(`${n}. Question about passage ${n}?`, "A. a B. b C. c D. d");
    const quiz = parseQuizQuestions(lines.join("\n"));
    const passageId = quiz.questions[1].contextId!;

    // Group (Q2-7) doesn't fit next to Q1 → starts a new batch, kept whole.
    const together = buildQuizBatches(quiz, { maxTokens: 10000, maxQuestions: 6 });
    assert.deepEqual(together.map((b) => b.questions.map((q) => q.number)), [[1], [2, 3, 4, 5, 6, 7]]);

    // Forced split: every batch with a passage question carries the passage.
    const split = buildQuizBatches(quiz, { maxTokens: 10000, maxQuestions: 3 });
    for (const batch of split) {
        if (batch.questions.some((q) => q.contextId === passageId)) {
            assert.ok(batch.contexts.some((c) => c.id === passageId));
        }
    }
    assert.deepEqual(split.flatMap((b) => b.questions.map((q) => q.number)), [1, 2, 3, 4, 5, 6, 7]);
});
