import { z } from "zod";
import { QuizContext, QuizOption } from "./quiz-question.parser";

export type QuizConfidence = "high" | "medium" | "low";

// One AI answer. Fields other than `number` are lenient (.catch) so a single
// sloppy field doesn't throw away an otherwise valid answer — but the item is
// then flagged for review, never silently "trusted".
const AnswerItemSchema = z.object({
    number: z.coerce.number().int().positive(),
    answer: z
        .union([z.string(), z.number(), z.null()])
        .optional()
        .transform((v) => (v === null || v === undefined || String(v).trim() === "" ? null : String(v).trim())),
    alternatives: z.array(z.union([z.string(), z.number()]).transform(String)).catch([]).default([]),
    explanation: z.string().catch("").default(""),
    confidence: z.enum(["high", "medium", "low"]).catch("low").default("low"),
    needsReview: z.boolean().catch(true).default(false),
});

export type AISolvedAnswer = z.infer<typeof AnswerItemSchema>;

const BatchResponseSchema = z.object({ answers: z.array(z.unknown()) });

const DetectedQuestionSchema = AnswerItemSchema.extend({
    question: z.string().catch("").default(""),
    options: z
        .array(z.object({ label: z.string().min(1).max(3), text: z.string() }))
        .catch([])
        .default([]),
});

const DetectedResponseSchema = z.object({ questions: z.array(z.unknown()) });

export type AIDetectedQuestion = z.infer<typeof DetectedQuestionSchema>;

const parseJson = (raw: string): unknown => {
    try {
        return JSON.parse(raw);
    } catch {
        throw new Error("AI response is not valid JSON");
    }
};

// Validates one batch response against the question numbers that were asked.
// Items for unknown numbers or with an invalid shape are dropped; throws (→
// bounded validation retry) only when nothing usable came back.
export const parseSolvedBatch = (raw: string, expectedNumbers: number[]): Map<number, AISolvedAnswer> => {
    const envelope = BatchResponseSchema.safeParse(parseJson(raw));
    if (!envelope.success) throw new Error("AI response has no \"answers\" array");

    const expected = new Set(expectedNumbers);
    const answers = new Map<number, AISolvedAnswer>();
    for (const item of envelope.data.answers) {
        const parsed = AnswerItemSchema.safeParse(item);
        if (parsed.success && expected.has(parsed.data.number) && !answers.has(parsed.data.number)) {
            answers.set(parsed.data.number, parsed.data);
        }
    }
    if (answers.size === 0) throw new Error("AI response contains no valid answer for the requested questions");
    return answers;
};

// Validates the "detect + solve" response used when the code parser could not
// find question boundaries.
export const parseDetectedQuiz = (raw: string): AIDetectedQuestion[] => {
    const envelope = DetectedResponseSchema.safeParse(parseJson(raw));
    if (!envelope.success) throw new Error("AI response has no \"questions\" array");
    const questions = envelope.data.questions
        .map((item) => DetectedQuestionSchema.safeParse(item))
        .filter((r) => r.success)
        .map((r) => r.data!)
        .filter((q) => q.question.trim() || q.options.length);
    if (questions.length === 0) throw new Error("AI response contains no valid question");
    return questions;
};

// ------------------------------------------------------- API result ----

export interface SolvedQuestion {
    number: number;
    sourceNumber: number;
    contextId: string | null;
    question: string;
    options: QuizOption[];
    // Option label for multiple choice, answer text otherwise; null when the
    // question could not be answered (missing image/data, AI failure...).
    answer: string | null;
    // Full text of the chosen option (multiple choice) or the answer itself.
    answerText: string | null;
    alternatives: string[];
    explanation: string;
    confidence: QuizConfidence;
    needsReview: boolean;
    // "solved" | "unanswerable" (AI said data is missing) | "failed" (AI error).
    status: "solved" | "unanswerable" | "failed";
}

export interface QuizSolverResult {
    fileName: string;
    fileType: "pdf" | "docx";
    parseMode: "structured" | "ai_detected";
    questions: SolvedQuestion[];
    contexts: QuizContext[];
    warnings: string[];
    summary: {
        total: number;
        answered: number;
        needsReview: number;
        failed: number;
    };
    batches: { total: number; failed: number };
    providers: string[];
    timings: {
        extractionMs: number;
        parsingMs: number;
        aiMs: number;
        finalizeMs: number;
        totalMs: number;
    };
}
