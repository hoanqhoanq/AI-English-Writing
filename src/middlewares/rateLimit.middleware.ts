import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/apiResponse";

// Simple in-memory rate limiter for AI requests
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// `scope` (optional) gives an endpoint its own counter instead of sharing the
// per-user counter with every other AI endpoint.
export const aiRateLimiter = (maxRequests: number = 30, windowMs: number = 60 * 1000, scope?: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const userKey = req.user?.id || req.ip || "unknown";
        const key = scope ? `${scope}:${userKey}` : userKey;
        const now = Date.now();
        const record = requestCounts.get(key);

        if (!record || now > record.resetTime) {
            requestCounts.set(key, { count: 1, resetTime: now + windowMs });
            return next();
        }

        if (record.count >= maxRequests) {
            ApiResponse.error(
                res,
                "Bạn đã gửi quá nhiều yêu cầu AI trong thời gian ngắn. Vui lòng thử lại sau giây lát.",
                429
            );
            return;
        }

        record.count++;
        next();
    };
};
