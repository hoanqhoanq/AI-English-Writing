import { Request, Response } from "express";
import { userService } from "./user.service";
import { ApiResponse } from "../../utils/apiResponse";

export class UserController {
    async getProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực", 401);
                return;
            }
            const profile = await userService.getProfile(userId);
            ApiResponse.success(res, profile, "Lấy thông tin hồ sơ thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể lấy thông tin", 400);
        }
    }

    async updateProfile(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ApiResponse.error(res, "Chưa xác thực", 401);
                return;
            }
            const updated = await userService.updateProfile(userId, req.body);
            ApiResponse.success(res, updated, "Cập nhật hồ sơ thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Không thể cập nhật thông tin", 400);
        }
    }

    async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await userService.getAllUsers();
            ApiResponse.success(res, users, "Lấy danh sách người dùng thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi lấy danh sách người dùng", 400);
        }
    }

    async toggleUserStatus(req: Request, res: Response): Promise<void> {
        try {
            const userId = String(req.params.id);
            const updated = await userService.toggleUserStatus(userId);
            ApiResponse.success(
                res,
                updated,
                `Đã ${updated.isActive ? "mở khóa" : "khóa"} tài khoản ${updated.email}`
            );
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi thay đổi trạng thái tài khoản", 400);
        }
    }

    async updateUser(req: Request, res: Response): Promise<void> {
        try {
            const userId = String(req.params.id);
            const updated = await userService.updateUser(userId, req.body);
            ApiResponse.success(res, updated, "Cập nhật tài khoản người dùng thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi cập nhật người dùng", 400);
        }
    }

    async deleteUser(req: Request, res: Response): Promise<void> {
        try {
            const userId = String(req.params.id);
            const deleted = await userService.deleteUser(userId);
            ApiResponse.success(res, deleted, "Xóa người dùng thành công");
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi xóa người dùng", 400);
        }
    }

    async createUser(req: Request, res: Response): Promise<void> {
        try {
            const newUser = await userService.createUser(req.body);
            ApiResponse.success(res, newUser, "Tạo người dùng mới thành công", 201);
        } catch (error: any) {
            ApiResponse.error(res, error.message || "Lỗi tạo người dùng mới", 400);
        }
    }
}

export const userController = new UserController();

