import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { ApiResponse } from "../utils/apiResponse";
import { UserRole } from "../types";
import { memoryStore } from "../db/memoryStore";

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            if (token && token !== "null" && token !== "undefined") {
                try {
                    const decoded = verifyToken(token) as any;
                    if (decoded && (decoded.id || decoded.userId)) {
                        req.user = {
                            id: decoded.id || decoded.userId,
                            email: decoded.email || "user@example.com",
                            role: decoded.role || "user",
                            name: decoded.name || "Nguyen Van A",
                            level: decoded.level || "B1",
                        };
                        return next();
                    }
                } catch (jwtErr) {
                    // Token expired or invalid, fall back to default active demo learner
                }
            }
        }

        // If no auth token provided or token invalid, assign default active learner user
        const demoUser = memoryStore.users.find((u) => u.email === "user@example.com") || memoryStore.users[0];
        req.user = {
            id: demoUser ? demoUser._id : "usr_learner_001",
            email: demoUser ? demoUser.email : "user@example.com",
            role: "user",
            name: demoUser ? demoUser.name : "Nguyen Van A",
            level: demoUser ? (demoUser.level as any) : "B1",
        };
        next();
    } catch (error: any) {
        req.user = {
            id: "usr_learner_001",
            email: "user@example.com",
            role: "user",
            name: "Nguyen Van A",
            level: "B1",
        };
        next();
    }
};

export const strictAuthenticate = (req: Request, res: Response, next: NextFunction): void => {
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

