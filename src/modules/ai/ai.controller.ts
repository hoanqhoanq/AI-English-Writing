import { Request, Response } from "express";
import { aiService } from "./ai.service";
import { ApiResponse } from "../../utils/apiResponse";
import { GenerateQuestionsInput } from "./ai.validation";

export class AIController {
    async generateQuestions(req: Request, res: Response): Promise<void> {
        try {
            const input = req.body as GenerateQuestionsInput;
            const generated = await aiService.generateQuestions(input);
            ApiResponse.success(res, generated, `Tạo thành công ${generated.length} câu hỏi bằng AI`);
        } catch (error: any) {
            ApiResponse.error(res, "AI không thể tạo câu hỏi hợp lệ. Vui lòng thử lại.", 500);
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
