import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { aiRateLimiter } from "../../middlewares/rateLimit.middleware";
import { quizSolverController, uploadQuizFile } from "./quiz-solver.controller";

// API AI Quiz Solver — được gắn tại /api/quiz-solver (xem src/app.ts).
// Tải đề PDF/DOCX → AI trả đáp án và giải thích. Không lưu file hay kết quả vào database:
// kết quả chỉ giữ tạm trong bộ nhớ (mặc định 15 phút) để xem lại / tải lại trang.
const router = Router();

// GET /api/quiz-solver/config — Giới hạn dung lượng và định dạng file được chấp nhận (cần đăng nhập).
router.get("/config", authenticate, (req, res) => quizSolverController.getConfig(req, res));

// POST /api/quiz-solver/solve — Tải đề (multipart, trường "file") và bắt đầu phân tích.
// Trả về 202 + jobId (đang xử lý) hoặc 200 + kết quả có sẵn nếu cùng file vừa được phân tích.
// Rate limit chạy TRƯỚC khi nhận file, với bộ đếm riêng (không dùng chung với các API AI khác).
router.post("/solve", authenticate, aiRateLimiter(10, 60 * 1000, "quiz-solver"), uploadQuizFile, (req, res) =>
    quizSolverController.solve(req, res)
);

// GET /api/quiz-solver/jobs/:jobId — Trạng thái / giai đoạn xử lý / kết quả của một lần phân tích (chỉ chủ sở hữu).
router.get("/jobs/:jobId", authenticate, (req, res) => quizSolverController.getJob(req, res));

export default router;
