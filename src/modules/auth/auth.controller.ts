import { Request, Response } from "express";
import { authService } from "./auth.service";
import { ApiResponse } from "../../utils/apiResponse";

export class AuthController {
    async register(req: Request, res: Response): Promise<void> {
        try {
            const result = await authService.register(req.body);
            ApiResponse.success(res, result, "Đăng ký tài khoản thành công", 201);
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Đăng ký thất bại", 400);
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            ApiResponse.success(res, result, "Đăng nhập thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Đăng nhập thất bại", 401);
        }
    }

    async getMe(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực", 401);
                return;
            }
            const user = await authService.getMe(userId);
            ApiResponse.success(res, user, "Lấy thông tin người dùng thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy thông tin người dùng", 404);
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        ApiResponse.success(res, null, "Đăng xuất thành công");
    }
}

export const authController = new AuthController();
