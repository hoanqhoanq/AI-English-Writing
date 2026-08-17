import { z } from "zod";

export const CreateSessionSchema = z.object({
    level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
    topic: z.string().optional(),
    grammarTopic: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    questionCount: z.number().min(1).max(20).default(5),
});

export const SubmitAttemptSchema = z
    .object({
        sessionId: z.string().optional(),
        questionId: z.string().min(1, "Thiếu ID câu hỏi"),
        answer: z.string().optional(),
        userAnswer: z.string().optional(),
    })
    .refine((data) => !!(data.answer?.trim() || data.userAnswer?.trim()), {
        message: "Vui lòng nhập câu trả lời tiếng Anh của bạn",
        path: ["answer"],
    });

export const HistoryQuerySchema = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    level: z.string().optional(),
    topic: z.string().optional(),
    status: z.enum(["correct", "partially_correct", "incorrect"]).optional(),
    errorType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});
