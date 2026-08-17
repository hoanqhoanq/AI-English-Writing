import { Request, Response } from "express";
import { aiService } from "./ai.service";
import { WritingQuestionModel } from "../writing/question.model";
import { memoryStore } from "../../db/memoryStore";
import mongoose from "mongoose";
import { ApiResponse } from "../../utils/apiResponse";

export class AIController {
    async generateQuestions(req: Request, res: Response): Promise<void> {
        try {
            const { level, topic, grammarTopic, difficulty, count, saveToDatabase } = req.body;
            const generated = await aiService.generateQuestions({
                level: level || "B1",
                topic: topic || "Daily Life",
                grammarTopic,
                difficulty: difficulty || "medium",
                count: count || 5,
            });

            if (saveToDatabase) {
                const isMongo = mongoose.connection.readyState === 1;
                if (isMongo) {
                    const toInsert = generated.map((q) => ({
                        ...q,
                        isActive: true,
                        createdBy: req.user?.id || "ai",
                    }));
                    await WritingQuestionModel.insertMany(toInsert);
                } else {
                    generated.forEach((q) => {
                        memoryStore.questions.unshift({
                            _id: "q_ai_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
                            vietnameseSentence: q.vietnameseSentence,
                            referenceAnswer: q.referenceAnswer,
                            alternativeAnswers: q.alternativeAnswers,
                            level: q.level as any,
                            topic: q.topic,
                            grammarTopic: q.grammarTopic,
                            difficulty: q.difficulty as any,
                            keywords: q.keywords,
                            isActive: true,
                            createdBy: req.user?.id || "ai",
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    });
                }
            }

            ApiResponse.success(res, generated, `Tạo thành công ${generated.length} câu hỏi bằng AI`);
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi tạo câu hỏi AI", 400);
        }
    }

    async evaluateWriting(req: Request, res: Response): Promise<void> {
        try {
            const { vietnameseSentence, referenceAnswer, alternativeAnswers, userAnswer, level, topic, grammarTopic } =
                req.body;

            const result = await aiService.evaluateWriting({
                vietnameseSentence,
                referenceAnswer: referenceAnswer || "",
                alternativeAnswers: alternativeAnswers || [],
                userAnswer,
                level: level || "B1",
                topic,
                grammarTopic,
            });

            ApiResponse.success(res, result, "Đánh giá câu trả lời thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi đánh giá AI", 400);
        }
    }

    async analyzeWeakness(req: Request, res: Response): Promise<void> {
        try {
            const result = await aiService.analyzeWeakness(req.body);
            ApiResponse.success(res, result, "Phân tích điểm yếu AI thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi phân tích điểm yếu AI", 400);
        }
    }
}

export const aiController = new AIController();
