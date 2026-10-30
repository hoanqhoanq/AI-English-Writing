import { NextFunction, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { ApiResponse } from "../../utils/apiResponse";
import { config } from "../../config/env";
import { maxQuizFileBytes } from "./quiz-file.service";
import { QuizSolverError } from "./quiz-solver.errors";
import { quizSolverService } from "./quiz-solver.service";

// Memory storage: the upload never touches the disk (no temp file to leak or
// clean up, no user-supplied name ever used as a path). The buffer lives only
// until text extraction finishes.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxQuizFileBytes(), files: 1, fields: 0, parts: 2 },
    fileFilter: (req, file, cb) => {
        // Cheap early reject by extension so a disallowed file isn't buffered;
        // the real format check (magic bytes + MIME) runs in the service.
        const ext = path.extname(file.originalname || "").toLowerCase();
        if (ext !== ".pdf" && ext !== ".docx") {
            cb(new QuizSolverError("UNSUPPORTED_FILE", "Chỉ hỗ trợ file PDF (.pdf) hoặc Word (.docx) hợp lệ.", 415));
            return;
        }
        cb(null, true);
    },
}).single("file");

const sendError = (res: Response, err: any) => {
    if (err instanceof QuizSolverError) {
        ApiResponse.error(res, err.message, err.statusCode, [{ code: err.code }]);
        return;
    }
    console.error("[QUIZ SOLVER] unexpected controller error:", err?.name, String(err?.message || "").slice(0, 200));
    ApiResponse.error(res, "Đã xảy ra lỗi khi xử lý đề. Vui lòng thử lại.", 500);
};

export const uploadQuizFile = (req: Request, res: Response, next: NextFunction): void => {
    upload(req, res, (err: any) => {
        if (!err) return next();
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return sendError(res, new QuizSolverError("FILE_TOO_LARGE", `File vượt quá giới hạn ${config.quizSolver.maxFileMb} MB. Vui lòng chọn file nhỏ hơn.`, 413));
            }
            return sendError(res, new QuizSolverError("NO_FILE", "Vui lòng gửi đúng một file PDF hoặc DOCX (trường \"file\").", 400));
        }
        if (err instanceof QuizSolverError) return sendError(res, err);
        return sendError(res, new QuizSolverError("CORRUPT_FILE", "Không đọc được dữ liệu tải lên. Vui lòng thử lại.", 400));
    });
};

export class QuizSolverController {
    getConfig(req: Request, res: Response): void {
        ApiResponse.success(res, {
            maxFileMb: config.quizSolver.maxFileMb,
            acceptedExtensions: [".pdf", ".docx"],
        });
    }

    solve(req: Request, res: Response): void {
        try {
            const file = req.file;
            if (!file) throw new QuizSolverError("NO_FILE", "Vui lòng chọn một file PDF hoặc DOCX.", 400);
            const job = quizSolverService.startSolve(req.user!.id, file);
            ApiResponse.success(
                res,
                job,
                job.reused ? "Đề này vừa được phân tích — trả lại kết quả đã có" : "Đã nhận đề, đang phân tích",
                job.status === "processing" ? 202 : 200
            );
        } catch (err) {
            sendError(res, err);
        }
    }

    getJob(req: Request, res: Response): void {
        const job = quizSolverService.getJob(req.user!.id, String(req.params.jobId));
        if (!job) {
            ApiResponse.error(res, "Không tìm thấy phiên phân tích (có thể đã hết hạn). Vui lòng tải đề lên lại.", 404);
            return;
        }
        ApiResponse.success(res, job);
    }
}

export const quizSolverController = new QuizSolverController();
