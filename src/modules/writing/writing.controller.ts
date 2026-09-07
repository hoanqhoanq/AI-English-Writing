import { Request, Response } from "express";
import { writingService } from "./writing.service";
import { ApiResponse } from "../../utils/apiResponse";

export class WritingController {
    async getQuestions(req: Request, res: Response): Promise<void> {
        try {
            const { level, topic, grammarTopic, difficulty, limit, page } = req.query;
            const result = await writingService.getQuestions({
                level: level as string,
                topic: topic as string,
                grammarTopic: grammarTopic as string,
                difficulty: difficulty as string,
                limit: limit ? Number(limit) : undefined,
                page: page ? Number(page) : undefined,
            });
            ApiResponse.success(res, result, "Lấy danh sách câu hỏi thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy câu hỏi", 400);
        }
    }

    async getQuestionById(req: Request, res: Response): Promise<void> {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const question = await writingService.getQuestionById(id, false);
            ApiResponse.success(res, question, "Lấy thông tin câu hỏi thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không tìm thấy câu hỏi", 404);
        }
    }

    async createSession(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const result = await writingService.createSession(userId, req.body);
            ApiResponse.success(res, result, "Tạo phiên luyện tập thành công", 201);
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể tạo phiên luyện tập", 400);
        }
    }

    async getSessionById(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const result = await writingService.getSessionById(id, userId);
            ApiResponse.success(res, result, "Lấy thông tin phiên luyện tập thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không tìm thấy phiên luyện tập", 404);
        }
    }

    async submitAttempt(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const result = await writingService.submitAttempt(userId, req.body);
            ApiResponse.success(res, result, "Đánh giá bài viết thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Đánh giá bài viết thất bại", 400);
        }
    }

    async getAttemptById(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const attempt = await writingService.getAttemptById(id, userId);
            ApiResponse.success(res, attempt, "Lấy chi tiết bài làm thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không tìm thấy bài làm", 404);
        }
    }

    async getHistory(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const history = await writingService.getHistory(userId, req.query);
            ApiResponse.success(res, history, "Lấy lịch sử luyện tập thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy lịch sử", 400);
        }
    }

    async getAdminQuestions(req: Request, res: Response): Promise<void> {
        try {
            const result = await writingService.getAllQuestionsAdmin(req.query);
            ApiResponse.success(res, result, "Lấy danh sách câu hỏi quản trị thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy danh sách câu hỏi", 400);
        }
    }

    async createQuestion(req: Request, res: Response): Promise<void> {
        try {
            const newQ = await writingService.createQuestion(req.body);
            ApiResponse.success(res, newQ, "Tạo câu hỏi mới thành công", 201);
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể tạo câu hỏi", 400);
        }
    }

    async createQuestionsBulk(req: Request, res: Response): Promise<void> {
        try {
            const questions = await Promise.all(
                (req.body.questions || []).map((question: any) => writingService.createQuestion({
                    ...question,
                    createdBy: req.user?.id,
                }))
            );
            ApiResponse.success(res, questions, "Lưu các câu hỏi thành công", 201);
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lưu các câu hỏi", 400);
        }
    }

    async updateQuestion(req: Request, res: Response): Promise<void> {
        try {
            const id = String(req.params.id);
            const updated = await writingService.updateQuestion(id, req.body);
            ApiResponse.success(res, updated, "Cập nhật câu hỏi thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể cập nhật câu hỏi", 400);
        }
    }

    async deleteQuestion(req: Request, res: Response): Promise<void> {
        try {
            const id = String(req.params.id);
            const deleted = await writingService.deleteQuestion(id);
            ApiResponse.success(res, deleted, "Xóa câu hỏi thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể xóa câu hỏi", 400);
        }
    }

    async getAdminEvaluations(req: Request, res: Response): Promise<void> {
        try {
            const result = await writingService.getAllAttemptsAdmin(req.query);
            ApiResponse.success(res, result, "Lấy lịch sử chấm bài AI thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy lịch sử chấm bài", 400);
        }
    }
}

export const writingController = new WritingController();

