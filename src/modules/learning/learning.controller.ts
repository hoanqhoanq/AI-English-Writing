import { Request, Response } from "express";
import { learningService } from "./learning.service";
import { ApiResponse } from "../../utils/apiResponse";

export class LearningController {
    async getTopics(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const { category, search } = req.query;
            const topics = await learningService.getTopics(userId, {
                category: category as string,
                search: search as string,
            });
            ApiResponse.success(res, topics, "Lấy danh sách nội dung học thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy danh sách nội dung học", 503);
        }
    }

    async getTopicDetail(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const slug = String(req.params.slug);
            const detail = await learningService.getTopicDetail(userId, slug);
            ApiResponse.success(res, detail, "Lấy chi tiết nội dung học thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy chi tiết nội dung học", 404);
        }
    }

    async markSectionViewed(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const slug = String(req.params.slug);
            const { section } = req.body;
            const result = await learningService.markSectionViewed(userId, slug, section);
            ApiResponse.success(res, result, "Cập nhật tiến độ thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể cập nhật tiến độ", 400);
        }
    }

    async getProgressOverview(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const overview = await learningService.getProgressOverview(userId);
            ApiResponse.success(res, overview, "Lấy tổng quan tiến độ thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy tổng quan tiến độ", 503);
        }
    }

    // --- AI Writing ---

    async getAIWritingTopics(req: Request, res: Response): Promise<void> {
        try {
            const topics = learningService.getAIWritingTopics();
            ApiResponse.success(res, topics, "Lấy danh sách chủ đề AI Writing thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy danh sách chủ đề", 400);
        }
    }

    async generateAIWritingQuestion(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const { tenseSlug, topicKey, customTopic } = req.body;
            const question = await learningService.generateAIWritingQuestion(userId, tenseSlug, topicKey, customTopic);
            ApiResponse.success(res, question, "Tạo đề bài AI thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "AI không thể tạo câu hỏi hợp lệ. Vui lòng thử lại.", 400);
        }
    }

    // --- Admin ---

    async getAdminTopics(req: Request, res: Response): Promise<void> {
        try {
            const result = await learningService.getAllTopicsAdmin(req.query);
            ApiResponse.success(res, result, "Lấy danh sách nội dung học quản trị thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy danh sách nội dung học", 400);
        }
    }

    async createTopic(req: Request, res: Response): Promise<void> {
        try {
            const newTopic = await learningService.createTopic(req.body, req.user?.id);
            ApiResponse.success(res, newTopic, "Tạo nội dung học thành công", 201);
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể tạo nội dung học", 400);
        }
    }

    async updateTopic(req: Request, res: Response): Promise<void> {
        try {
            const id = String(req.params.id);
            const updated = await learningService.updateTopic(id, req.body);
            ApiResponse.success(res, updated, "Cập nhật nội dung học thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể cập nhật nội dung học", 400);
        }
    }

    async deleteTopic(req: Request, res: Response): Promise<void> {
        try {
            const id = String(req.params.id);
            const deleted = await learningService.deleteTopic(id);
            ApiResponse.success(res, deleted, "Xóa nội dung học thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể xóa nội dung học", 400);
        }
    }
}

export const learningController = new LearningController();
