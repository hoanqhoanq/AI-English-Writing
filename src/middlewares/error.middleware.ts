import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/apiResponse";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    console.error("[ERROR HANDLER]", err);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";

    ApiResponse.error(res, message, statusCode, err.errors || []);
};
