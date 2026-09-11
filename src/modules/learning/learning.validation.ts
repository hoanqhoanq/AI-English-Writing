import { z } from "zod";

const LearningExampleSchema = z.object({
    english: z.string().min(1),
    vietnamese: z.string().optional(),
    explanation: z.string().min(1),
});

const LearningMistakeSchema = z.object({
    wrong: z.string().min(1),
    correct: z.string().min(1),
    explanation: z.string().min(1),
});

const LearningTopicBaseSchema = z.object({
    slug: z
        .string()
        .trim()
        .min(2)
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang"),
    title: z.string().trim().min(2),
    titleVi: z.string().trim().min(2),
    category: z.enum(["grammar", "writing_skill"]),
    description: z.string().default(""),
    theory: z.string().default(""),
    examples: z.array(LearningExampleSchema).default([]),
    commonMistakes: z.array(LearningMistakeSchema).default([]),
    practiceTag: z.string().optional(),
    externalPracticePath: z.string().optional(),
    cefrLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    order: z.number().default(0),
    isPublished: z.boolean().default(true),
});

export const CreateLearningTopicSchema = LearningTopicBaseSchema;
export const UpdateLearningTopicSchema = LearningTopicBaseSchema.partial();

export const MarkSectionViewedSchema = z.object({
    section: z.enum(["learn", "examples", "practice", "aiWriting"]),
});

export const GenerateAIWritingQuestionSchema = z
    .object({
        tenseSlug: z.string().trim().min(1, "Thiếu chủ điểm ngữ pháp"),
        topicKey: z.string().trim().min(1).optional(),
        customTopic: z.string().trim().min(2, "Chủ đề tùy chỉnh quá ngắn").max(100, "Chủ đề tùy chỉnh tối đa 100 ký tự").optional(),
    })
    .refine((data) => !!data.topicKey !== !!data.customTopic, {
        message: "Vui lòng chọn đúng một trong hai: topicKey hoặc customTopic",
        path: ["topicKey"],
    });
