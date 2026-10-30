// Controlled, user-facing errors of the AI Quiz Solver. `message` is always a
// short Vietnamese text that is safe to show in the UI (never a stack trace or
// provider detail); `code` lets the frontend/tests tell cases apart.
export type QuizSolverErrorCode =
    | "NO_FILE"
    | "EMPTY_FILE"
    | "FILE_TOO_LARGE"
    | "UNSUPPORTED_FILE"
    | "CORRUPT_FILE"
    | "ENCRYPTED_PDF"
    | "SCANNED_PDF"
    | "NO_TEXT"
    | "TEXT_TOO_LONG"
    | "NO_QUESTIONS"
    | "JOB_IN_PROGRESS"
    | "AI_RATE_LIMIT"
    | "AI_OVERLOADED"
    | "AI_TIMEOUT"
    | "AI_CONFIG"
    | "AI_INVALID_RESPONSE"
    | "AI_FAILED"
    | "INTERNAL";

export class QuizSolverError extends Error {
    constructor(
        public readonly code: QuizSolverErrorCode,
        message: string,
        public readonly statusCode: number = 400
    ) {
        super(message);
        this.name = "QuizSolverError";
    }
}

// Maps a raw provider/AIService error to a controlled error. Providers only
// expose failures through their messages (see classifyGeminiError in
// gemini.provider.ts), so this classifies by the same markers.
export const toAIError = (err: any): QuizSolverError => {
    if (err instanceof QuizSolverError) return err;
    const msg = String(err?.message || err || "");

    if (err?.__noAIProvider || /API key|API_KEY|not configured|PERMISSION_DENIED|\b401\b|\b403\b/i.test(msg)) {
        return new QuizSolverError(
            "AI_CONFIG",
            "Dịch vụ AI chưa được cấu hình đúng. Vui lòng liên hệ quản trị viên.",
            503
        );
    }
    if (/\b429\b|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(msg)) {
        return new QuizSolverError(
            "AI_RATE_LIMIT",
            "Dịch vụ AI đang vượt giới hạn lượt gọi. Vui lòng thử lại sau 1–2 phút.",
            503
        );
    }
    if (/timed out|timeout|deadline/i.test(msg)) {
        return new QuizSolverError(
            "AI_TIMEOUT",
            "AI phản hồi quá lâu. Vui lòng thử lại, hoặc chia đề thành file ngắn hơn.",
            504
        );
    }
    if (/\b5\d{2}\b|UNAVAILABLE|high demand|overloaded/i.test(msg)) {
        return new QuizSolverError(
            "AI_OVERLOADED",
            "Dịch vụ AI đang quá tải. Vui lòng thử lại sau ít phút.",
            503
        );
    }
    if (err?.__isValidationError) {
        return new QuizSolverError(
            "AI_INVALID_RESPONSE",
            "AI trả về kết quả không hợp lệ. Vui lòng thử lại.",
            502
        );
    }
    return new QuizSolverError("AI_FAILED", "Không thể giải đề bằng AI lúc này. Vui lòng thử lại sau.", 502);
};
