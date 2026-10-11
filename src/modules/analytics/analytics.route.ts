import { Router } from "express";
import { analyticsController } from "./analytics.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { aiRateLimiter } from "../../middlewares/rateLimit.middleware";

// API Thống kê & chẩn đoán điểm yếu — được gắn tại /api/analytics (xem src/app.ts).
// Số liệu được tính lại mỗi lần gọi, chỉ trên dữ liệu luyện viết câu của chính người dùng.
const router = Router();

// GET /api/analytics/overview — Tổng quan: tổng số bài, điểm trung bình/cao nhất/thấp nhất, độ chính xác (cần đăng nhập).
router.get("/overview", authenticate, (req, res) => analyticsController.getOverview(req, res));
// GET /api/analytics/admin/stats — Thống kê toàn hệ thống cho Dashboard admin (chỉ admin).
router.get("/admin/stats", authenticate, authorize("admin"), (req, res) => analyticsController.getSystemStats(req, res));
// GET /api/analytics/errors — Phân bố lỗi của chính mình theo loại lỗi (cần đăng nhập).
router.get("/errors", authenticate, (req, res) => analyticsController.getErrors(req, res));
// GET /api/analytics/topics — Thống kê điểm theo từng chủ đề (cần đăng nhập).
router.get("/topics", authenticate, (req, res) => analyticsController.getTopics(req, res));
// GET /api/analytics/grammar — Thống kê điểm theo từng chủ điểm ngữ pháp (cần đăng nhập).
router.get("/grammar", authenticate, (req, res) => analyticsController.getGrammar(req, res));
// GET /api/analytics/trends — Điểm theo thời gian và hoạt động các ngày gần đây, dùng vẽ biểu đồ tiến bộ (cần đăng nhập).
router.get("/trends", authenticate, (req, res) => analyticsController.getTrends(req, res));
// GET /api/analytics/ai-analysis — Xem bản chẩn đoán AI đã lưu gần nhất (null nếu chưa có). CHỈ ĐỌC, không gọi AI.
router.get("/ai-analysis", authenticate, (req, res) => analyticsController.getLatestAIAnalysis(req, res));
// POST /api/analytics/ai-analysis — Chủ động nhờ AI chẩn đoán điểm yếu mới và lưu lại (chỉ chạy khi học viên bấm nút).
// Cần đăng nhập, giới hạn 20 lượt/phút.
router.post("/ai-analysis", authenticate, aiRateLimiter(20), (req, res) =>
    analyticsController.triggerAIAnalysis(req, res)
);

export default router;
