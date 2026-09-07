import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { verifyToken } from "../utils/jwt";
import { ApiResponse } from "../utils/apiResponse";
import { UserRole } from "../types";
import { UserModel } from "../modules/users/user.model";
import { memoryStore } from "../db/memoryStore";

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        const userId = decoded.id || decoded.userId;

        // Re-check against the database on every request (not just the JWT claims) so
        // a deleted/deactivated account loses access immediately instead of waiting
        // for its still-valid access token to expire.
        const isMongoActive = mongoose.connection.readyState === 1;
        const isActive = isMongoActive
            ? (await UserModel.findById(userId).select("isActive"))?.isActive
            : memoryStore.users.find((u) => u._id === userId)?.isActive;

        if (isActive === undefined) {
            ApiResponse.error(res, "Tài khoản không tồn tại", 401);
            return;
        }
        if (!isActive) {
            ApiResponse.error(res, "Tài khoản của bạn đã bị khóa", 401);
            return;
        }

        req.user = {
            id: userId,
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

