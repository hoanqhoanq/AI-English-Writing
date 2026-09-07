import { Request, Response } from "express";
import { authService } from "./auth.service";
import { ApiResponse } from "../../utils/apiResponse";
import { config } from "../../config/env";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/auth";

const refreshCookieOptions = () => ({
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax" as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: config.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
});

export class AuthController {
    async register(req: Request, res: Response): Promise<void> {
        try {
            const { user, accessToken, refreshToken } = await authService.register(req.body, req.headers["user-agent"]);
            res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
            ApiResponse.success(res, { user, accessToken }, "Đăng ký tài khoản thành công", 201);
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Đăng ký thất bại", 400);
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const { user, accessToken, refreshToken } = await authService.login(email, password, req.headers["user-agent"]);
            res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
            ApiResponse.success(res, { user, accessToken }, "Đăng nhập thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Đăng nhập thất bại", 401);
        }
    }

    async refresh(req: Request, res: Response): Promise<void> {
        try {
            const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
            const { user, accessToken, refreshToken } = await authService.refresh(rawRefreshToken, req.headers["user-agent"]);
            res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
            ApiResponse.success(res, { user, accessToken }, "Làm mới phiên đăng nhập thành công");
        } catch (error: any) {
            res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
            ApiResponse.error(res, error.message || "Không thể làm mới phiên đăng nhập", 401);
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
        try {
            const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
            await authService.logout(rawRefreshToken);
        } finally {
            res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
            ApiResponse.success(res, null, "Đăng xuất thành công");
        }
    }
}

export const authController = new AuthController();
