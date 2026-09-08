import { Request, Response } from "express";
import { journeyService } from "./journey.service";
import { ApiResponse } from "../../utils/apiResponse";

export class JourneyController {
    async getChapters(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const chapters = await journeyService.getChapters(userId);
            ApiResponse.success(res, chapters, "Lấy lộ trình học thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy lộ trình học", 503);
        }
    }

    async getChapterDetail(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const id = String(req.params.grammarTopicId);
            const detail = await journeyService.getChapterDetail(userId, id);
            ApiResponse.success(res, detail, "Lấy chi tiết chương học thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy chi tiết chương học", 404);
        }
    }

    async getOverview(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const overview = await journeyService.getOverview(userId);
            ApiResponse.success(res, overview, "Lấy tổng quan tiến độ thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy tổng quan tiến độ", 503);
        }
    }

    async getRecommendations(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const recommendations = await journeyService.getRecommendations(userId);
            ApiResponse.success(res, recommendations, "Lấy đề xuất luyện tập thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy đề xuất luyện tập", 503);
        }
    }
}

export const journeyController = new JourneyController();
