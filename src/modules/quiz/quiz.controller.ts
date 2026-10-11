import { Request, Response } from "express";
import { quizService } from "./quiz.service";
import { ApiResponse } from "../../utils/apiResponse";

export class QuizController {
    async generate(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const { difficulty, tenses, grammar, topic, questionCount } = req.body;
            const result = await quizService.generateQuiz(userId, { difficulty, tenses, grammar, topic, questionCount });
            ApiResponse.success(res, result, "Tạo Quiz thành công", 201);
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể tạo Quiz lúc này. Vui lòng thử lại.", 400);
        }
    }

    async submit(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const quizId = String(req.params.quizId);
            const { answers } = req.body;
            const result = await quizService.submitQuiz(userId, quizId, answers);
            ApiResponse.success(res, result, "Nộp bài Quiz thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể nộp bài Quiz", 400);
        }
    }

    async getHistory(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const { page, limit } = req.query;
            const result = await quizService.getHistory(userId, {
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            });
            ApiResponse.success(res, result, "Lấy lịch sử Quiz thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy lịch sử Quiz", 503);
        }
    }

    async getHistoryDetail(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const id = String(req.params.id);
            const attempt = await quizService.getHistoryDetail(userId, id);
            ApiResponse.success(res, attempt, "Lấy chi tiết Quiz thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không tìm thấy lịch sử Quiz", 404);
        }
    }

    async getStats(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const stats = await quizService.getQuizStats(userId);
            ApiResponse.success(res, stats, "Lấy thống kê Quiz thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy thống kê Quiz", 503);
        }
    }
}

export const quizController = new QuizController();
