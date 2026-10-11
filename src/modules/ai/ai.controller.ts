import { Request, Response } from "express";
import { aiService } from "./ai.service";
import { ApiResponse } from "../../utils/apiResponse";

export class AIController {
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

}

export const aiController = new AIController();
