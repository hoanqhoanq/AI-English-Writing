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
import journeyRouter from "./modules/journey/journey.route";
import paragraphRouter from "./modules/paragraph/paragraph.route";
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

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api", topicRouter);
app.use("/api/topics", topicRouter);
app.use("/api/writing", writingRouter);
app.use("/api/ai", aiRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/journey", journeyRouter);
app.use("/api/paragraph", paragraphRouter);

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
