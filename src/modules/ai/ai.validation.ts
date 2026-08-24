import { z } from "zod";

export const GenerateQuestionsSchema = z.object({
    level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
    difficulty: z.enum(["easy", "medium", "hard"]),
    grammarTopics: z.array(z.string().trim().min(1)).min(1).max(20),
    topicPrompt: z.string().trim().min(3).max(500),
    numberOfQuestions: z.number().int().min(1).max(20),
});

export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsSchema>;