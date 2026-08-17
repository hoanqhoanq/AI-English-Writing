import { Response } from "express";

export class ApiResponse {
    static success<T>(res: Response, data: T, message: string = "Thành công", statusCode: number = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }

    static error(res: Response, message: string = "Đã xảy ra lỗi", statusCode: number = 500, errors: any[] = []) {
        return res.status(statusCode).json({
            success: false,
            message,
            errors
        });
    }
}
