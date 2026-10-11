import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { RegisterSchema, LoginSchema } from "./auth.validation";

// API Xác thực — được gắn tại /api/auth (xem src/app.ts).
// Cấp access token (JWT, trả trong body) và refresh token (cookie HttpOnly).
const router = Router();

// POST /api/auth/register — Đăng ký tài khoản học viên mới (công khai, kiểm tra dữ liệu bằng RegisterSchema).
router.post("/register", validate(RegisterSchema), (req, res) => authController.register(req, res));
// POST /api/auth/login — Đăng nhập học viên, trả access token + cookie refresh token (công khai).
router.post("/login", validate(LoginSchema), (req, res) => authController.login(req, res));
// POST /api/auth/logout — Đăng xuất: thu hồi phiên refresh token và xóa cookie.
router.post("/logout", (req, res) => authController.logout(req, res));
// GET /api/auth/me — Lấy thông tin người dùng đang đăng nhập (cần đăng nhập). Frontend dùng để làm mới streak/điểm.
router.get("/me", authenticate, (req, res) => authController.getMe(req, res));
// POST /api/auth/refresh — Đổi refresh token (cookie) lấy access token mới, có xoay vòng token.
// Reads the refresh token from the HttpOnly cookie, not the access token, so it
// intentionally does NOT go through `authenticate` (the access token may already be expired).
router.post("/refresh", (req, res) => authController.refresh(req, res));

// Admin portal — separate endpoints so its refresh-token cookie never overlaps
// with the User portal's, and so login itself rejects non-admin credentials.
// POST /api/auth/admin/login — Đăng nhập trang quản trị; từ chối (403) nếu tài khoản không phải admin.
router.post("/admin/login", validate(LoginSchema), (req, res) => authController.adminLogin(req, res));
// POST /api/auth/admin/refresh — Làm mới phiên của Admin Portal (dùng cookie admin_refresh_token riêng).
router.post("/admin/refresh", (req, res) => authController.adminRefresh(req, res));
// POST /api/auth/admin/logout — Đăng xuất Admin Portal, xóa cookie admin_refresh_token.
router.post("/admin/logout", (req, res) => authController.adminLogout(req, res));

export default router;
