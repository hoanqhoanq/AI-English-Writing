import { Request, Response } from "express";
import { authService } from "./auth.service";
import { ApiResponse } from "../../utils/apiResponse";
import { config } from "../../config/env";

// Separate cookie names for the User and Admin portals so logging into one
// never overwrites (and thus never silently re-authenticates) the other —
// each portal's frontend bundle only ever calls its own set of endpoints
// below, so the two sessions cannot cross.
const USER_REFRESH_COOKIE_NAME = "user_refresh_token";
const ADMIN_REFRESH_COOKIE_NAME = "admin_refresh_token";
const REFRESH_COOKIE_PATH = "/api/auth";

const refreshCookieOptions = () => ({
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax" as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: config.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
});

export class AuthController {
    // --- User portal (unchanged behavior, just the renamed cookie) ---

    async register(req: Request, res: Response): Promise<void> {
        try {
            const { user, accessToken, refreshToken } = await authService.register(req.body, req.headers["user-agent"]);
            res.cookie(USER_REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
            ApiResponse.success(res, { user, accessToken }, "Đăng ký tài khoản thành công", 201);
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Đăng ký thất bại", 400);
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const { user, accessToken, refreshToken } = await authService.login(email, password, req.headers["user-agent"]);
            res.cookie(USER_REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
            ApiResponse.success(res, { user, accessToken }, "Đăng nhập thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Đăng nhập thất bại", 401);
        }
    }

    async refresh(req: Request, res: Response): Promise<void> {
        try {
            const rawRefreshToken = req.cookies?.[USER_REFRESH_COOKIE_NAME];
            const { user, accessToken, refreshToken } = await authService.refresh(rawRefreshToken, req.headers["user-agent"]);
            res.cookie(USER_REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
            ApiResponse.success(res, { user, accessToken }, "Làm mới phiên đăng nhập thành công");
        } catch (error: any) {
            res.clearCookie(USER_REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
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
            const rawRefreshToken = req.cookies?.[USER_REFRESH_COOKIE_NAME];
            await authService.logout(rawRefreshToken);
        } finally {
            res.clearCookie(USER_REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
            ApiResponse.success(res, null, "Đăng xuất thành công");
        }
    }

    // --- Admin portal (own cookie, own endpoints; reuses authService as-is) ---

    async adminLogin(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const { user, accessToken, refreshToken } = await authService.login(email, password, req.headers["user-agent"]);

            if (user.role !== "admin") {
                // Revoke the session that was just issued — a non-admin credential
                // check must never leave a usable refresh token behind.
                await authService.logout(refreshToken);
                ApiResponse.error(res, "Tài khoản không có quyền quản trị", 403);
                return;
            }

            res.cookie(ADMIN_REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
            ApiResponse.success(res, { user, accessToken }, "Đăng nhập quản trị thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Đăng nhập quản trị thất bại", 401);
        }
    }

    async adminRefresh(req: Request, res: Response): Promise<void> {
        try {
            const rawRefreshToken = req.cookies?.[ADMIN_REFRESH_COOKIE_NAME];
            const { user, accessToken, refreshToken } = await authService.refresh(rawRefreshToken, req.headers["user-agent"]);

            if (user.role !== "admin") {
                // Defense in depth: a session that was valid when issued but whose
                // account is no longer an admin (e.g. demoted) must not refresh.
                await authService.logout(refreshToken);
                res.clearCookie(ADMIN_REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
                ApiResponse.error(res, "Tài khoản không có quyền quản trị", 403);
                return;
            }

            res.cookie(ADMIN_REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
            ApiResponse.success(res, { user, accessToken }, "Làm mới phiên quản trị thành công");
        } catch (error: any) {
            res.clearCookie(ADMIN_REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
            ApiResponse.error(res, error.message || "Không thể làm mới phiên quản trị", 401);
        }
    }

    async adminLogout(req: Request, res: Response): Promise<void> {
        try {
            const rawRefreshToken = req.cookies?.[ADMIN_REFRESH_COOKIE_NAME];
            await authService.logout(rawRefreshToken);
        } finally {
            res.clearCookie(ADMIN_REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
            ApiResponse.success(res, null, "Đăng xuất quản trị thành công");
        }
    }
}

export const authController = new AuthController();
