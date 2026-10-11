import { Router } from "express";
import { userController } from "./user.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { CreateUserSchema, UpdateProfileSchema } from "../auth/auth.validation";

// API Người dùng — được gắn tại /api/users (xem src/app.ts).
const router = Router();

// Profile endpoints
// GET /api/users/profile — Xem hồ sơ của chính mình (cần đăng nhập).
router.get("/profile", authenticate, (req, res) => userController.getProfile(req, res));
// PUT /api/users/profile — Sửa hồ sơ của chính mình: tên, avatar, mục tiêu số câu mỗi ngày (cần đăng nhập).
router.put("/profile", authenticate, validate(UpdateProfileSchema), (req, res) =>
    userController.updateProfile(req, res)
);

// Admin management endpoints
// GET /api/users/all — Danh sách toàn bộ người dùng (chỉ admin).
router.get("/all", authenticate, authorize("admin"), (req, res) => userController.getAllUsers(req, res));
// POST /api/users — Admin tạo tài khoản mới (chỉ admin).
router.post("/", authenticate, authorize("admin"), validate(CreateUserSchema), (req, res) => userController.createUser(req, res));
// PUT /api/users/:id/status — Khóa/mở khóa tài khoản: đảo trạng thái isActive (chỉ admin).
router.put("/:id/status", authenticate, authorize("admin"), (req, res) => userController.toggleUserStatus(req, res));
// PUT /api/users/:id — Admin cập nhật thông tin một người dùng (chỉ admin).
router.put("/:id", authenticate, authorize("admin"), (req, res) => userController.updateUser(req, res));
// DELETE /api/users/:id — Admin xóa một người dùng (chỉ admin).
router.delete("/:id", authenticate, authorize("admin"), (req, res) => userController.deleteUser(req, res));

export default router;

