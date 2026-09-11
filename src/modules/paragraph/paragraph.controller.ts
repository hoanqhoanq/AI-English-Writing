import { Request, Response } from "express";
import { paragraphService } from "./paragraph.service";
import { ApiResponse } from "../../utils/apiResponse";

export class ParagraphController {
    async getTopics(req: Request, res: Response): Promise<void> {
        try {
            const { levelTier, page, limit } = req.query;
            const result = await paragraphService.getTopics({
                levelTier: levelTier as string,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            });
            ApiResponse.success(res, result, "Lấy danh sách đề bài viết đoạn văn thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy danh sách đề bài", 503);
        }
    }

    async getTopicById(req: Request, res: Response): Promise<void> {
        try {
            const id = String(req.params.id);
            const topic = await paragraphService.getTopicById(id);
            ApiResponse.success(res, topic, "Lấy thông tin đề bài thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không tìm thấy đề bài", 404);
        }
    }

    async submitAttempt(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const { topicId, text } = req.body;
            const result = await paragraphService.submitAttempt(userId, topicId, text);
            ApiResponse.success(res, result, "Đánh giá đoạn văn thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Đánh giá đoạn văn thất bại", 400);
        }
    }

    async getMyAttempts(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const { page, limit } = req.query;
            const result = await paragraphService.getUserAttempts(userId, {
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            });
            ApiResponse.success(res, result, "Lấy lịch sử viết đoạn văn thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy lịch sử", 503);
        }
    }

    async getMyAttemptForTopic(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const topicId = String(req.params.topicId);
            const attempt = await paragraphService.getUserAttempt(userId, topicId);
            ApiResponse.success(res, attempt, "Lấy bài làm thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy bài làm", 503);
        }
    }

    async generateTopic(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const { topic, difficulty } = req.body;
            const result = await paragraphService.generateAIParagraphTopic(userId, topic, difficulty);
            ApiResponse.success(res, result, "Tạo đề bài AI thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "AI không thể tạo đề bài. Vui lòng thử lại.", 400);
        }
    }

    async getMyStats(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const stats = await paragraphService.getMyParagraphStats(userId);
            ApiResponse.success(res, stats, "Lấy thống kê viết đoạn văn thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy thống kê", 503);
        }
    }

    // --- Admin ---

    async getAdminTopics(req: Request, res: Response): Promise<void> {
        try {
            const result = await paragraphService.getAllTopicsAdmin(req.query);
            ApiResponse.success(res, result, "Lấy danh sách đề bài quản trị thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy danh sách đề bài", 400);
        }
    }

    async createTopic(req: Request, res: Response): Promise<void> {
        try {
            const newTopic = await paragraphService.createTopic(req.body, req.user?.id);
            ApiResponse.success(res, newTopic, "Tạo đề bài viết đoạn văn thành công", 201);
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể tạo đề bài", 400);
        }
    }

    async updateTopic(req: Request, res: Response): Promise<void> {
        try {
            const id = String(req.params.id);
            const updated = await paragraphService.updateTopic(id, req.body);
            ApiResponse.success(res, updated, "Cập nhật đề bài thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể cập nhật đề bài", 400);
        }
    }

    async deleteTopic(req: Request, res: Response): Promise<void> {
        try {
            const id = String(req.params.id);
            const deleted = await paragraphService.deleteTopic(id);
            ApiResponse.success(res, deleted, "Xóa đề bài thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể xóa đề bài", 400);
        }
    }

    async getAdminAttempts(req: Request, res: Response): Promise<void> {
        try {
            const result = await paragraphService.getAllAttemptsAdmin(req.query);
            ApiResponse.success(res, result, "Lấy danh sách bài làm quản trị thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy danh sách bài làm", 400);
        }
    }
}

export const paragraphController = new ParagraphController();
