import { z } from "zod";

export const GenerateQuizSchema = z.object({
    difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
    // New multi-select field: array of tense slugs (e.g. "present-simple"), or
    // ["all"] for all 12 tenses. Optional and additive — `grammar` (legacy,
    // single tense name or "All") is kept working for any existing caller.
    tenses: z.array(z.string().trim().min(1)).optional(),
    grammar: z.string().trim().min(1).optional(),
    topic: z.string().trim().min(1).optional(),
    questionCount: z
        .number()
        .int("Số câu phải là số nguyên")
        .min(10, "Số câu tối thiểu là 10")
        .max(50, "Số câu tối đa là 50"),
});

export const SubmitQuizAnswersSchema = z.object({
    answers: z
        .array(
            z.object({
                questionId: z.string().min(1, "Thiếu questionId"),
                selectedAnswer: z.number().int().min(0).max(3),
            })
        )
        .min(1, "Chưa có câu trả lời nào được gửi"),
});
