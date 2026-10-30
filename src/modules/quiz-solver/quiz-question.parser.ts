// Turns extracted quiz text into ordered questions, answer options and shared
// contexts (instructions / reading passages) — entirely in code, so the AI is
// only ever asked to *solve*, never to re-read or re-structure the document.

export interface QuizOption {
    label: string;
    text: string;
}

export interface QuizContext {
    id: string;
    text: string;
}

export interface ParsedQuestion {
    // Sequential position in the document (1..N) — the key used everywhere,
    // even when the document restarts numbering in a new section.
    number: number;
    // The number as printed in the document.
    sourceNumber: number;
    contextId: string | null;
    question: string;
    options: QuizOption[];
}

export interface ParsedQuiz {
    questions: ParsedQuestion[];
    contexts: QuizContext[];
    warnings: string[];
}

export interface QuizBatch {
    questions: ParsedQuestion[];
    contexts: QuizContext[];
    estimatedTokens: number;
}

// --------------------------------------------------------- normalizing ----

export const normalizeQuizText = (raw: string): string => {
    const lines = raw
        .replace(/\r\n?/g, "\n")
        .replace(/[   　]/g, " ")
        .replace(/[​-‍﻿­]/g, "")
        .split("\n")
        .map((line) => line.replace(/[ \t]+/g, " ").trim())
        // Page artefacts only (e.g. "Page 2 of 5", "-- 3 of 4 --") — a bare
        // number on its own line is kept, it can be a question number.
        .filter((line) => !/^(?:page|trang)\s*\d+(?:\s*(?:of|\/|trên)\s*\d+)?$/i.test(line))
        .filter((line) => !/^-+\s*\d+\s*(?:of\s*\d+)?\s*-+$/i.test(line));

    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

// ------------------------------------------------------------- parsing ----

// "Question 12.", "Câu 3:", "Câu hỏi 4 -", "Q5)", "12.", "12)" at line start.
const QUESTION_START =
    /^(?:(?:question|câu\s*hỏi|câu|q)\s*\.?\s*(\d{1,3})\s*[.:)\-–]?|(\d{1,3})\s*[.)](?=\s|$))\s*/i;

// Section / instruction lines that start a new shared context after a
// question without options (whose block would otherwise swallow them).
const SECTION_START =
    /^(?:(?:part|section|phần|exercise|bài\s*tập|bài|task|passage)\s*[\dIVX]+\b|(?:read|choose|fill|complete|rewrite|mark the letter|circle|match|listen|give the correct|put the|supply|find the|đọc|chọn|điền|viết lại|hoàn thành))/i;

// "questions 5-8", "from 5 to 8", "câu 5 đến 8" — a context's question range.
const CONTEXT_RANGE = /(?:questions?|câu|from|từ)\s*(\d{1,3})\s*(?:-|–|—|to|đến|tới)\s*(?:câu\s*)?(\d{1,3})\b/i;

interface OptionMarker {
    letter: string;
    start: number;
    end: number;
}

const findOptionMarkers = (block: string, upper: boolean): OptionMarker[] => {
    const markers: OptionMarker[] = [];
    // "A.", "A)", "(A)" preceded by start/whitespace and followed by whitespace.
    // ":" is deliberately not a marker — "A: ... B: ..." is a dialogue.
    const re = upper ? /(^|\s)(?:\(([A-H])\)|([A-H])[.)])(?=\s)/g : /(^|\s)(?:\(([a-h])\)|([a-h])[.)])(?=\s)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(block))) {
        markers.push({ letter: (m[2] || m[3]).toUpperCase(), start: m.index + m[1].length, end: m.index + m[0].length });
    }

    // Keep the first consecutive A, B, C... run.
    const picked: OptionMarker[] = [];
    for (const marker of markers) {
        const expected = String.fromCharCode(65 + picked.length);
        if (marker.letter === expected) picked.push(marker);
        else if (marker.letter === "A" && picked.length < 2) {
            picked.length = 0;
            picked.push(marker);
        }
    }
    return picked.length >= 2 ? picked : [];
};

// Splits a question block (text after the question number) into stem,
// options and any trailing text (an instruction/passage for later questions).
const splitQuestionBlock = (block: string): { stem: string; options: QuizOption[]; trailing: string } => {
    let markers = findOptionMarkers(block, true);
    if (markers.length === 0) markers = findOptionMarkers(block, false);

    if (markers.length === 0) {
        // No options: a later section/instruction line ends the question.
        const lines = block.split("\n");
        const cut = lines.findIndex((line, i) => i > 0 && SECTION_START.test(line));
        if (cut > 0) return { stem: lines.slice(0, cut).join("\n").trim(), options: [], trailing: lines.slice(cut).join("\n").trim() };
        return { stem: block.trim(), options: [], trailing: "" };
    }

    const stem = block.slice(0, markers[0].start).trim();
    const options: QuizOption[] = [];
    let trailing = "";
    markers.forEach((marker, i) => {
        if (i < markers.length - 1) {
            options.push({ label: marker.letter, text: block.slice(marker.end, markers[i + 1].start).trim() });
            return;
        }
        // The last option ends at the end of its line; what follows belongs to
        // the next questions (e.g. "Read the passage..." + passage).
        const rest = block.slice(marker.end);
        const newline = rest.search(/\n/);
        options.push({ label: marker.letter, text: (newline === -1 ? rest : rest.slice(0, newline)).trim() });
        trailing = newline === -1 ? "" : rest.slice(newline + 1).trim();
    });
    return { stem, options: options.map((o) => ({ ...o, text: o.text.replace(/\s*\n\s*/g, " ") })), trailing };
};

export const parseQuizQuestions = (text: string): ParsedQuiz => {
    const lines = text.split("\n");
    const warnings: string[] = [];

    // 1. Question boundaries: numbered lines whose numbers follow on from the
    // previous question (n+1, a small gap, or a restart at 1 in a new
    // section). Out-of-sequence numbers (years, "5) …" inside a passage) are
    // treated as ordinary text.
    const starts: { line: number; sourceNumber: number; rest: string }[] = [];
    let gapCount = 0;
    lines.forEach((line, index) => {
        const m = QUESTION_START.exec(line);
        if (!m) return;
        const n = Number(m[1] ?? m[2]);
        const prev = starts.length ? starts[starts.length - 1].sourceNumber : null;
        const accept = prev === null ? n <= 200 : n === prev + 1 || n === 1 || (n > prev + 1 && n <= prev + 3);
        if (!accept) return;
        if (prev !== null && n > prev + 1) gapCount++;
        starts.push({ line: index, sourceNumber: n, rest: line.slice(m[0].length) });
    });

    const contexts: QuizContext[] = [];
    const questions: ParsedQuestion[] = [];
    let activeContext: { id: string; from?: number; to?: number } | null = null;

    const addContext = (raw: string) => {
        const textValue = raw.trim();
        if (!textValue) return;
        const id = `C${contexts.length + 1}`;
        contexts.push({ id, text: textValue });
        const range = CONTEXT_RANGE.exec(textValue.slice(0, 200));
        const from = range ? Number(range[1]) : undefined;
        const to = range ? Number(range[2]) : undefined;
        activeContext = from !== undefined && to !== undefined && to >= from ? { id, from, to } : { id };
    };

    if (starts.length === 0) return { questions, contexts, warnings };

    addContext(lines.slice(0, starts[0].line).join("\n"));

    starts.forEach((start, i) => {
        const endLine = i + 1 < starts.length ? starts[i + 1].line : lines.length;
        const block = [start.rest, ...lines.slice(start.line + 1, endLine)].join("\n");
        const { stem, options, trailing } = splitQuestionBlock(block);

        // A context with an explicit range ("Questions 5-8") applies only there.
        const ctx = activeContext as { id: string; from?: number; to?: number } | null;
        const inRange = !ctx || ctx.from === undefined || (start.sourceNumber >= ctx.from && start.sourceNumber <= ctx.to!);
        questions.push({
            number: questions.length + 1,
            sourceNumber: start.sourceNumber,
            contextId: ctx && inRange ? ctx.id : null,
            question: stem,
            options,
        });
        if (trailing) addContext(trailing);
    });

    if (gapCount > 0) {
        warnings.push("Số thứ tự câu hỏi trong đề không liên tục — có thể một số câu chưa được nhận diện, hãy kiểm tra lại.");
    }
    const emptyStems = questions.filter((q) => !q.question && q.options.length === 0).length;
    if (emptyStems > 0) {
        warnings.push(`${emptyStems} câu không đọc được nội dung — có thể câu hỏi nằm trong hình ảnh.`);
    }
    return { questions, contexts, warnings };
};

// ------------------------------------------------------------ batching ----

// Rough token estimate (no tokenizer dependency): ~3 characters per token is
// conservative for mixed English/Vietnamese text.
export const estimateTokens = (text: string): number => Math.ceil(text.length / 3);

export const formatQuestionForPrompt = (q: ParsedQuestion): string => {
    const header = `Q${q.number}${q.contextId ? ` [context ${q.contextId}]` : ""}: ${q.question || "(không có nội dung)"}`;
    return [header, ...q.options.map((o) => `${o.label}. ${o.text}`)].join("\n");
};

export const formatContextForPrompt = (c: QuizContext): string => `[CONTEXT ${c.id}]\n${c.text}\n[/CONTEXT ${c.id}]`;

// Groups questions into AI calls bounded by estimated tokens and question
// count. Questions sharing a context stay together when they fit; a context
// is included (once) in every batch that has a question using it, so a
// split reading passage never loses its text. Order is preserved.
export const buildQuizBatches = (
    quiz: ParsedQuiz,
    limits: { maxTokens: number; maxQuestions: number }
): QuizBatch[] => {
    const contextById = new Map(quiz.contexts.map((c) => [c.id, c]));
    const batches: QuizBatch[] = [];
    let current: QuizBatch = { questions: [], contexts: [], estimatedTokens: 0 };

    const flush = () => {
        if (current.questions.length) batches.push(current);
        current = { questions: [], contexts: [], estimatedTokens: 0 };
    };
    const contextCost = (id: string | null, batch: QuizBatch): number => {
        if (!id || batch.contexts.some((c) => c.id === id)) return 0;
        const ctx = contextById.get(id);
        return ctx ? estimateTokens(formatContextForPrompt(ctx)) : 0;
    };

    // Consecutive questions with the same context form one group.
    const groups: ParsedQuestion[][] = [];
    for (const q of quiz.questions) {
        const last = groups[groups.length - 1];
        if (last && last[0].contextId === q.contextId) last.push(q);
        else groups.push([q]);
    }

    for (const group of groups) {
        const groupTokens = contextCost(group[0].contextId, { questions: [], contexts: [], estimatedTokens: 0 }) +
            group.reduce((sum, q) => sum + estimateTokens(formatQuestionForPrompt(q)), 0);
        const fitsWhole =
            current.estimatedTokens + groupTokens <= limits.maxTokens &&
            current.questions.length + group.length <= limits.maxQuestions;
        if (!fitsWhole && current.questions.length) flush();

        for (const q of group) {
            const cost = contextCost(q.contextId, current) + estimateTokens(formatQuestionForPrompt(q));
            if (
                current.questions.length &&
                (current.estimatedTokens + cost > limits.maxTokens || current.questions.length >= limits.maxQuestions)
            ) {
                flush();
            }
            const ctxCost = contextCost(q.contextId, current);
            if (ctxCost && q.contextId) current.contexts.push(contextById.get(q.contextId)!);
            current.questions.push(q);
            current.estimatedTokens += ctxCost + estimateTokens(formatQuestionForPrompt(q));
        }
    }
    flush();
    return batches;
};
