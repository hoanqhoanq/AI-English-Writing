import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";

import authRouter from "./modules/auth/auth.route";
import userRouter from "./modules/users/user.route";
import topicRouter from "./modules/topics/topic.route";
import writingRouter from "./modules/writing/writing.route";
import aiRouter from "./modules/ai/ai.route";
import analyticsRouter from "./modules/analytics/analytics.route";
import paragraphRouter from "./modules/paragraph/paragraph.route";
import learningRouter from "./modules/learning/learning.route";
import quizRouter from "./modules/quiz/quiz.route";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })
);

app.use(
    cors({
        // Reflects the request's own origin (instead of "*") so the browser will
        // actually send/accept the HttpOnly refresh-token cookie, which requires
        // credentials: true — wildcard origins are not allowed together with credentials.
        origin: (origin, callback) => callback(null, origin || true),
        credentials: true,
    })
);

app.use(cookieParser());

app.use(morgan("dev"));

app.use(express.json({ limit: "5mb" }));

app.use(express.urlencoded({
    extended: true,
    limit: "5mb"
}));

// GET /health và GET /api/health — Kiểm tra server còn hoạt động (công khai), dùng cho giám sát/triển khai.
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "AI English Writing Practice API is running"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "AI English Writing Practice API is running"
    });
});

// API Routes — mỗi module nghiệp vụ được gắn vào một tiền tố /api/<tên>.
// Mô tả chi tiết từng endpoint nằm ở chú thích trong file *.route.ts của module đó.
app.use("/api/auth", authRouter); // Đăng ký, đăng nhập, đăng xuất, refresh token (User + Admin)
app.use("/api/users", userRouter); // Hồ sơ cá nhân và quản lý người dùng (admin)
app.use("/api", topicRouter); // Chủ đề, chủ điểm ngữ pháp, cấp độ CEFR (gắn 2 lần: /api và /api/topics)
app.use("/api/topics", topicRouter);
app.use("/api/writing", writingRouter); // Ngân hàng câu hỏi, nộp bài viết câu để AI chấm, lịch sử làm bài
app.use("/api/ai", aiRouter); // Chấm thử một câu không lưu database
app.use("/api/analytics", analyticsRouter); // Thống kê cá nhân, thống kê hệ thống (admin), chẩn đoán điểm yếu bằng AI
app.use("/api/paragraph", paragraphRouter); // Luyện viết đoạn văn: đề, nộp bài, lịch sử các lần sửa
app.use("/api/learning", learningRouter); // Học ngữ pháp theo chủ đề, tiến độ, AI sinh câu hỏi luyện viết
app.use("/api/quiz", quizRouter); // Trắc nghiệm ngữ pháp: sinh quiz bằng AI, nộp bài, lịch sử, thống kê

// Path to client frontend build (client/dist)
const possibleDistPaths = [
    path.resolve(process.cwd(), "client/dist"),
    path.resolve(__dirname, "../client/dist"),
    path.resolve(__dirname, "../../client/dist"),
    path.resolve(process.cwd(), "dist/client")
];
const clientDistPath = possibleDistPaths.find((p) => fs.existsSync(p)) || path.resolve(process.cwd(), "client/dist");

if (fs.existsSync(clientDistPath)) {
    // Serve static assets from client/dist
    app.use(express.static(clientDistPath));

    // SPA fallback: Return index.html for non-API routes
    app.use((req, res, next) => {
        if (req.path.startsWith("/api") || req.path === "/health") {
            return next();
        }
        // If request is for admin routes, return admin.html when available
        if (req.path.startsWith('/admin')) {
            const adminPath = path.join(clientDistPath, 'admin.html');
            if (fs.existsSync(adminPath)) return res.sendFile(adminPath);
        }
        const indexPath = path.join(clientDistPath, "index.html");
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
        next();
    });
} else {
    app.get("/", (req, res) => {
        res.json({
            success: true,
            message: "AI English Writing Practice API is running"
        });
    });
}

// Database error & global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.name === "MongooseError" || err.name === "MongoNetworkError" || (err.message && err.message.includes("buffering timed out"))) {
        console.warn("[AI Studio] Database connection issue handled");
    }
    errorHandler(err, req, res, next);
});

export default app;
