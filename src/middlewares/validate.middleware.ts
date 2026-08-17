import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiResponse } from "../utils/apiResponse";

export const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }));
                ApiResponse.error(res, "Dữ liệu không hợp lệ", 422, formattedErrors);
                return;
            }
            ApiResponse.error(res, "Lỗi kiểm tra dữ liệu", 400);
        }
    };
};

export const validateQuery = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            req.query = await schema.parseAsync(req.query) as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }));
                ApiResponse.error(res, "Tham số truy vấn không hợp lệ", 422, formattedErrors);
                return;
            }
            ApiResponse.error(res, "Lỗi kiểm tra dữ liệu", 400);
        }
    };
};
