import { Request, Response } from "express";
import { topicService } from "./topic.service";
import { ApiResponse } from "../../utils/apiResponse";

export class TopicController {
    async getTopics(req: Request, res: Response): Promise<void> {
        try {
            const activeOnly = req.query.all !== "true";
            const topics = await topicService.getAllTopics(activeOnly);
            ApiResponse.success(res, topics, "Lấy danh sách chủ đề thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi lấy danh sách chủ đề", 400);
        }
    }

    async createTopic(req: Request, res: Response): Promise<void> {
        try {
            const newTopic = await topicService.createTopic(req.body);
            ApiResponse.success(res, newTopic, "Tạo chủ đề mới thành công", 201);
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi tạo chủ đề", 400);
        }
    }

    async updateTopic(req: Request, res: Response): Promise<void> {
        try {
            const id = String(req.params.id);
            const updated = await topicService.updateTopic(id, req.body);
            ApiResponse.success(res, updated, "Cập nhật chủ đề thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi cập nhật chủ đề", 400);
        }
    }

    async deleteTopic(req: Request, res: Response): Promise<void> {
        try {
            const id = String(req.params.id);
            const deleted = await topicService.deleteTopic(id);
            ApiResponse.success(res, deleted, "Xóa chủ đề thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi xóa chủ đề", 400);
        }
    }

    async getGrammar(req: Request, res: Response): Promise<void> {
        try {
            const activeOnly = req.query.all !== "true";
            const grammars = await topicService.getAllGrammarTopics(activeOnly);
            ApiResponse.success(res, grammars, "Lấy danh sách ngữ pháp thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi lấy danh sách ngữ pháp", 400);
        }
    }

    async createGrammar(req: Request, res: Response): Promise<void> {
        try {
            const newGrm = await topicService.createGrammar(req.body);
            ApiResponse.success(res, newGrm, "Tạo chủ điểm ngữ pháp mới thành công", 201);
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi tạo chủ điểm ngữ pháp", 400);
        }
    }

    async updateGrammar(req: Request, res: Response): Promise<void> {
        try {
            const id = String(req.params.id);
            const updated = await topicService.updateGrammar(id, req.body);
            ApiResponse.success(res, updated, "Cập nhật chủ điểm ngữ pháp thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi cập nhật chủ điểm ngữ pháp", 400);
        }
    }

    async deleteGrammar(req: Request, res: Response): Promise<void> {
        try {
            const id = String(req.params.id);
            const deleted = await topicService.deleteGrammar(id);
            ApiResponse.success(res, deleted, "Xóa chủ điểm ngữ pháp thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi xóa chủ điểm ngữ pháp", 400);
        }
    }

    async getLevels(req: Request, res: Response): Promise<void> {
        try {
            const levels = await topicService.getLevels();
            ApiResponse.success(res, levels, "Lấy danh mục CEFR Level thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi lấy danh mục Level", 400);
        }
    }
}

export const topicController = new TopicController();

