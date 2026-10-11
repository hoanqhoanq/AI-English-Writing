import { Router } from "express";
import { aiController } from "./ai.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { aiRateLimiter } from "../../middlewares/rateLimit.middleware";

// API AI trực tiếp — được gắn tại /api/ai (xem src/app.ts).
// Phần lớn chức năng AI đi qua các API của từng module (writing, quiz, paragraph...), file này chỉ giữ một endpoint.
const router = Router();

// POST /api/ai/evaluate-writing — Chấm thử một câu mà KHÔNG lưu vào database (dùng cho ô "Thử nghiệm nhanh" ở trang chủ).
// Khác với POST /api/writing/attempts (chấm thật và lưu kết quả). Cần đăng nhập, giới hạn 60 lượt/phút.
router.post("/evaluate-writing", authenticate, aiRateLimiter(60), (req, res) =>
    aiController.evaluateWriting(req, res)
);

export default router;
