import { Router } from "express";
import { learningController } from "./learning.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { aiRateLimiter } from "../../middlewares/rateLimit.middleware";
import {
    CreateLearningTopicSchema,
    GenerateAIWritingQuestionSchema,
    MarkSectionViewedSchema,
    UpdateLearningTopicSchema,
} from "./learning.validation";

// API Học ngữ pháp (Writing Learning) — được gắn tại /api/learning (xem src/app.ts).
// 19 chủ đề (12 thì + 7 kỹ năng viết), tiến độ học, và sinh câu hỏi bằng AI. Chỉ chạy khi có MongoDB.
const router = Router();

// User routes — every topic is always readable, nothing is ever locked.
// GET /api/learning/topics — Danh sách chủ đề kèm % hoàn thành của người dùng (cần đăng nhập).
router.get("/topics", authenticate, (req, res) => learningController.getTopics(req, res));
// GET /api/learning/topics/:slug — Chi tiết một chủ đề: lý thuyết, ví dụ, lỗi thường gặp, bài luyện (cần đăng nhập).
router.get("/topics/:slug", authenticate, (req, res) => learningController.getTopicDetail(req, res));
// POST /api/learning/topics/:slug/progress/section-viewed — Đánh dấu đã xem một phần (learn/examples/practice/aiWriting) để tính tiến độ.
router.post("/topics/:slug/progress/section-viewed", authenticate, validate(MarkSectionViewedSchema), (req, res) =>
    learningController.markSectionViewed(req, res)
);
// GET /api/learning/progress-overview — Tổng quan tiến độ: XP, Level, % hoàn thành, chủ điểm yếu (cần đăng nhập).
router.get("/progress-overview", authenticate, (req, res) => learningController.getProgressOverview(req, res));

// AI Writing — reuses the shared aiService.generateQuestions() under the hood,
// never calls Gemini automatically, only on this explicit user-triggered request.
// GET /api/learning/ai-writing/topics — 7 chủ đề gợi ý để chọn khi nhờ AI sinh đề (cần đăng nhập).
router.get("/ai-writing/topics", authenticate, (req, res) => learningController.getAIWritingTopics(req, res));
// POST /api/learning/ai-writing/generate — AI sinh 1 câu hỏi luyện viết theo thì/chủ đề/cấp độ đã chọn.
// Trả về đề tiếng Việt, KHÔNG kèm đáp án. Cần đăng nhập, giới hạn 60 lượt/phút.
router.post(
    "/ai-writing/generate",
    authenticate,
    aiRateLimiter(60),
    validate(GenerateAIWritingQuestionSchema),
    (req, res) => learningController.generateAIWritingQuestion(req, res)
);

// Admin CMS
// GET /api/learning/admin/topics — Admin xem danh sách chủ đề đầy đủ (chỉ admin).
router.get("/admin/topics", authenticate, authorize("admin"), (req, res) => learningController.getAdminTopics(req, res));
// POST /api/learning/admin/topics — Admin thêm chủ đề học (chỉ admin).
router.post("/admin/topics", authenticate, authorize("admin"), validate(CreateLearningTopicSchema), (req, res) =>
    learningController.createTopic(req, res)
);
// PUT /api/learning/admin/topics/:id — Admin sửa chủ đề học (chỉ admin).
router.put("/admin/topics/:id", authenticate, authorize("admin"), validate(UpdateLearningTopicSchema), (req, res) =>
    learningController.updateTopic(req, res)
);
// DELETE /api/learning/admin/topics/:id — Admin xóa chủ đề học (chỉ admin).
router.delete("/admin/topics/:id", authenticate, authorize("admin"), (req, res) => learningController.deleteTopic(req, res));

export default router;
