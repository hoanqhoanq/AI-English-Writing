import { Router } from "express";
import { quizController } from "./quiz.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { aiRateLimiter } from "../../middlewares/rateLimit.middleware";
import { GenerateQuizSchema, SubmitQuizAnswersSchema } from "./quiz.validation";

// API Trắc nghiệm ngữ pháp (Grammar Quiz) — được gắn tại /api/quiz (xem src/app.ts).
// AI sinh bài trắc nghiệm, server chấm điểm, lưu lịch sử và thống kê. Chỉ chạy khi có MongoDB.
const router = Router();

// POST /api/quiz/generate — AI sinh một bài quiz (10–50 câu, 4 đáp án) theo cấp độ/thì/chủ đề đã chọn.
// Trả về câu hỏi KHÔNG kèm đáp án đúng; đáp án chỉ được gửi sau khi nộp bài. Cần đăng nhập.
// One AI call generates the whole quiz (up to 50 questions) — a lower ceiling
// than the 60/min single-question endpoints since each call is heavier.
router.post("/generate", authenticate, aiRateLimiter(20), validate(GenerateQuizSchema), (req, res) =>
    quizController.generate(req, res)
);

// POST /api/quiz/:quizId/submit — Nộp bài quiz: server chấm điểm, trả về đáp án đúng và giải thích từng câu.
// Mỗi bài chỉ được nộp một lần. Cần đăng nhập.
router.post("/:quizId/submit", authenticate, validate(SubmitQuizAnswersSchema), (req, res) =>
    quizController.submit(req, res)
);

// GET /api/quiz/history — Danh sách các bài quiz đã làm của chính mình, có phân trang (cần đăng nhập).
router.get("/history", authenticate, (req, res) => quizController.getHistory(req, res));
// GET /api/quiz/history/:id — Chi tiết một bài quiz đã làm của chính mình (cần đăng nhập).
router.get("/history/:id", authenticate, (req, res) => quizController.getHistoryDetail(req, res));
// GET /api/quiz/stats — Thống kê Quiz: điểm trung bình, tỷ lệ đúng tổng, tỷ lệ đúng theo từng thì và cấp độ (cần đăng nhập).
router.get("/stats", authenticate, (req, res) => quizController.getStats(req, res));

export default router;
