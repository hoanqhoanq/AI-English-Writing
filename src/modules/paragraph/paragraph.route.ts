import { Router } from "express";
import { paragraphController } from "./paragraph.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { aiRateLimiter } from "../../middlewares/rateLimit.middleware";
import {
    CreateParagraphTopicSchema,
    GenerateParagraphTopicSchema,
    SubmitParagraphAttemptSchema,
    UpdateParagraphTopicSchema,
} from "./paragraph.validation";

// API Luyện viết đoạn văn (Paragraph Writing) — được gắn tại /api/paragraph (xem src/app.ts).
// Đề do admin soạn hoặc AI sinh, AI chấm theo 7 tiêu chí, giữ lịch sử các lần sửa. Chỉ chạy khi có MongoDB.
const router = Router();

// Topic routes (public read, matches /writing/questions being public)
// GET /api/paragraph/topics — Danh sách đề viết đoạn văn, lọc theo trình độ (công khai).
router.get("/topics", (req, res) => paragraphController.getTopics(req, res));
// GET /api/paragraph/topics/:id — Một đề viết đoạn văn (công khai).
router.get("/topics/:id", (req, res) => paragraphController.getTopicById(req, res));

// AI-generated topics — only called on explicit user action (choose topic +
// difficulty + click Generate), never automatically. Reuses aiService's shared
// Gemini plumbing, never a duplicate generation system.
// POST /api/paragraph/generate — AI sinh một đề đoạn văn mới theo chủ đề + độ khó, rồi lưu thành đề của hệ thống.
// Cần đăng nhập, giới hạn 60 lượt/phút.
router.post(
    "/generate",
    authenticate,
    aiRateLimiter(60),
    validate(GenerateParagraphTopicSchema),
    (req, res) => paragraphController.generateTopic(req, res)
);
// GET /api/paragraph/my-stats — Thống kê luyện đoạn văn của chính mình: số lượt, điểm trung bình (cần đăng nhập).
router.get("/my-stats", authenticate, (req, res) => paragraphController.getMyStats(req, res));

// Admin topic management
// GET /api/paragraph/admin/topics — Admin xem danh sách đề đầy đủ (chỉ admin).
router.get("/admin/topics", authenticate, authorize("admin"), (req, res) => paragraphController.getAdminTopics(req, res));
// POST /api/paragraph/admin/topics — Admin thêm đề đoạn văn (chỉ admin).
router.post("/admin/topics", authenticate, authorize("admin"), validate(CreateParagraphTopicSchema), (req, res) =>
    paragraphController.createTopic(req, res)
);
// PUT /api/paragraph/admin/topics/:id — Admin sửa đề đoạn văn (chỉ admin).
router.put("/admin/topics/:id", authenticate, authorize("admin"), validate(UpdateParagraphTopicSchema), (req, res) =>
    paragraphController.updateTopic(req, res)
);
// DELETE /api/paragraph/admin/topics/:id — Admin xóa đề đoạn văn (chỉ admin).
router.delete("/admin/topics/:id", authenticate, authorize("admin"), (req, res) => paragraphController.deleteTopic(req, res));
// GET /api/paragraph/admin/attempts — Admin xem bài làm đoạn văn của mọi học viên (chỉ admin).
router.get("/admin/attempts", authenticate, authorize("admin"), (req, res) => paragraphController.getAdminAttempts(req, res));

// Attempt routes (reuses the same aiRateLimiter ceiling as /writing/attempts)
// POST /api/paragraph/attempts — NỘP ĐOẠN VĂN: AI chấm 7 tiêu chí, lưu thêm 1 lần sửa (revision) vào cùng bài của đề đó.
// Cần đăng nhập, giới hạn 60 lượt/phút.
router.post("/attempts", authenticate, aiRateLimiter(60), validate(SubmitParagraphAttemptSchema), (req, res) =>
    paragraphController.submitAttempt(req, res)
);
// GET /api/paragraph/attempts — Danh sách bài đoạn văn của chính mình (cần đăng nhập).
router.get("/attempts", authenticate, (req, res) => paragraphController.getMyAttempts(req, res));
// GET /api/paragraph/attempts/:topicId — Bài làm hiện tại của chính mình cho một đề, kèm lịch sử các lần sửa (cần đăng nhập).
router.get("/attempts/:topicId", authenticate, (req, res) => paragraphController.getMyAttemptForTopic(req, res));

export default router;
