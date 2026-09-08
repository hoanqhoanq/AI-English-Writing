import { z } from "zod";

const ParagraphTopicBaseSchema = z.object({
    title: z.string().trim().min(3, "Tiêu đề phải có ít nhất 3 ký tự"),
    instruction: z.string().trim().min(10, "Yêu cầu đề bài phải có ít nhất 10 ký tự"),
    levelTier: z.enum(["Beginner", "Intermediate", "Advanced"]),
    minWords: z.number().int().min(10),
    maxWords: z.number().int().min(10),
    requirements: z.array(z.string()).default([]),
    topicCategory: z.string().optional(),
    isActive: z.boolean().default(true),
    order: z.number().default(0),
});

export const CreateParagraphTopicSchema = ParagraphTopicBaseSchema.refine(
    (data) => data.maxWords >= data.minWords,
    { message: "Số từ tối đa phải lớn hơn hoặc bằng số từ tối thiểu", path: ["maxWords"] }
);

export const UpdateParagraphTopicSchema = ParagraphTopicBaseSchema.partial();

// Cap paragraph text size to prevent oversized submissions to the AI/DB.
export const SubmitParagraphAttemptSchema = z.object({
    topicId: z.string().min(1, "Thiếu ID đề bài"),
    text: z
        .string()
        .trim()
        .min(1, "Vui lòng nhập đoạn văn của bạn")
        .max(4000, "Đoạn văn quá dài, vui lòng rút gọn dưới 4000 ký tự"),
});
