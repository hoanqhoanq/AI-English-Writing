import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { ApiResponse } from "../utils/apiResponse";
import { UserRole } from "../types";

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            ApiResponse.error(res, "Yêu cầu đăng nhập để truy cập tài nguyên này", 401);
            return;
        }

        const token = authHeader.split(" ")[1];
        if (!token || token === "null" || token === "undefined") {
            ApiResponse.error(res, "Token không hợp lệ", 401);
            return;
        }

        const decoded = verifyToken(token) as any;
        req.user = {
            id: decoded.id || decoded.userId,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name,
            level: decoded.level,
        };
        next();
    } catch (error: any) {
        ApiResponse.error(res, "Phiên đăng nhập đã hết hạn hoặc không hợp lệ", 401);
    }
};

export const strictAuthenticate = (req: Request, res: Response, next: NextFunction): void => {
    authenticate(req, res, next);
};

export const authorize = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            ApiResponse.error(res, "Chưa xác thực người dùng", 401);
            return;
        }

        if (!roles.includes(req.user.role)) {
            ApiResponse.error(res, "Bạn không có quyền thực hiện thao tác này", 403);
            return;
        }

        next();
    };
};

