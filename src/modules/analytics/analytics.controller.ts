import { Request, Response } from "express";
import { analyticsService } from "./analytics.service";
import { ApiResponse } from "../../utils/apiResponse";

export class AnalyticsController {
    async getOverview(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực người dùng", 401);
                return;
            }
            const overview = await analyticsService.getOverview(userId);
            ApiResponse.success(res, overview, "Lấy thống kê tổng quan thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi lấy thống kê tổng quan", 400);
        }
    }

    async getErrors(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực", 401);
                return;
            }
            const errors = await analyticsService.getErrors(userId);
            ApiResponse.success(res, errors, "Lấy phân bố lỗi thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi phân bố lỗi", 400);
        }
    }

    async getTopics(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực", 401);
                return;
            }
            const topics = await analyticsService.getTopics(userId);
            ApiResponse.success(res, topics, "Lấy phân tích chủ đề thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi phân tích chủ đề", 400);
        }
    }

    async getGrammar(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực", 401);
                return;
            }
            const grammar = await analyticsService.getGrammar(userId);
            ApiResponse.success(res, grammar, "Lấy phân tích ngữ pháp thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi phân tích ngữ pháp", 400);
        }
    }

    async getTrends(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực", 401);
                return;
            }
            const trends = await analyticsService.getTrends(userId);
            ApiResponse.success(res, trends, "Lấy xu hướng điểm số thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi lấy xu hướng", 400);
        }
    }

    async triggerAIAnalysis(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực", 401);
                return;
            }
            const result = await analyticsService.performAIAnalysis(userId);
            ApiResponse.success(res, result, "Chẩn đoán điểm yếu AI thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi phân tích AI", 400);
        }
    }

    async getLatestAIAnalysis(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực", 401);
                return;
            }
            const result = await analyticsService.getLatestAIAnalysis(userId);
            ApiResponse.success(res, result, "Lấy phân tích AI gần nhất thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi lấy phân tích AI", 400);
        }
    }

    async getSystemStats(req: Request, res: Response): Promise<void> {
        try {
            const stats = await analyticsService.getSystemStats();
            ApiResponse.success(res, stats, "Lấy thống kê toàn hệ thống thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi lấy thống kê hệ thống", 400);
        }
    }
}

export const analyticsController = new AnalyticsController();

