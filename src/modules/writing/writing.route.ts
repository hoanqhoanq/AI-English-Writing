import { Router } from "express";
import { writingController } from "./writing.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { aiRateLimiter } from "../../middlewares/rateLimit.middleware";
import { CreateSessionSchema, SubmitAttemptSchema } from "./writing.validation";

// API Luyện viết câu (Sentence Writing) — được gắn tại /api/writing (xem src/app.ts).
// Gồm ngân hàng câu hỏi, nộp bài để AI chấm, và lịch sử làm bài.
const router = Router();

// Question routes
// GET /api/writing/questions — Danh sách câu hỏi (công khai). Đáp án chuẩn KHÔNG bao giờ được trả về.
router.get("/questions", (req, res) => writingController.getQuestions(req, res));
// GET /api/writing/questions/:id — Một câu hỏi kèm gợi ý (hints), đã lược bỏ đáp án (công khai).
router.get("/questions/:id", (req, res) => writingController.getQuestionById(req, res));

// Admin Question & Evaluation routes
// GET /api/writing/admin/questions — Admin xem danh sách câu hỏi đầy đủ, có đáp án (chỉ admin).
router.get("/admin/questions", authenticate, authorize("admin"), (req, res) => writingController.getAdminQuestions(req, res));
// POST /api/writing/admin/questions — Admin thêm một câu hỏi (chỉ admin).
router.post("/admin/questions", authenticate, authorize("admin"), (req, res) => writingController.createQuestion(req, res));
// POST /api/writing/admin/questions/bulk — Admin thêm nhiều câu hỏi cùng lúc (chỉ admin).
router.post("/admin/questions/bulk", authenticate, authorize("admin"), (req, res) => writingController.createQuestionsBulk(req, res));
// PUT /api/writing/admin/questions/:id — Admin sửa một câu hỏi (chỉ admin).
router.put("/admin/questions/:id", authenticate, authorize("admin"), (req, res) => writingController.updateQuestion(req, res));
// DELETE /api/writing/admin/questions/:id — Admin xóa một câu hỏi (chỉ admin).
router.delete("/admin/questions/:id", authenticate, authorize("admin"), (req, res) => writingController.deleteQuestion(req, res));
// GET /api/writing/admin/evaluations — Admin xem lịch sử chấm bài của mọi học viên (chỉ admin).
router.get("/admin/evaluations", authenticate, authorize("admin"), (req, res) => writingController.getAdminEvaluations(req, res));

// Session routes
// POST /api/writing/sessions — Tạo một phiên luyện gồm nhiều câu (cần đăng nhập). Hiện chưa có giao diện dùng.
router.post("/sessions", authenticate, validate(CreateSessionSchema), (req, res) =>
    writingController.createSession(req, res)
);
// GET /api/writing/sessions/:id — Xem một phiên luyện (cần đăng nhập). Hiện chưa có giao diện dùng.
router.get("/sessions/:id", authenticate, (req, res) => writingController.getSessionById(req, res));

// Attempt & Evaluation routes
// POST /api/writing/attempts — NỘP BÀI: server lấy đáp án chuẩn, gọi AI chấm, lưu kết quả, cập nhật streak/điểm.
// Cần đăng nhập, giới hạn 60 lượt/phút, dữ liệu kiểm tra bằng SubmitAttemptSchema.
router.post("/attempts", authenticate, aiRateLimiter(60), validate(SubmitAttemptSchema), (req, res) =>
    writingController.submitAttempt(req, res)
);
// GET /api/writing/attempts — Lịch sử làm bài của chính mình; có thể lọc theo level/topic/status/questionId... (cần đăng nhập).
// History: every writing_attempts document belonging to the current user (req.user.id).
router.get("/attempts", authenticate, (req, res) => writingController.getHistory(req, res));
// GET /api/writing/attempts/:id — Chi tiết một lượt làm bài của chính mình (cần đăng nhập).
router.get("/attempts/:id", authenticate, (req, res) => writingController.getAttemptById(req, res));

export default router;
