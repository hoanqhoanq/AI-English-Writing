import { Router } from "express";
import { analyticsController } from "./analytics.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { aiRateLimiter } from "../../middlewares/rateLimit.middleware";

const router = Router();

router.get("/overview", authenticate, (req, res) => analyticsController.getOverview(req, res));
router.get("/admin/stats", authenticate, authorize("admin"), (req, res) => analyticsController.getSystemStats(req, res));
router.get("/errors", authenticate, (req, res) => analyticsController.getErrors(req, res));
router.get("/topics", authenticate, (req, res) => analyticsController.getTopics(req, res));
router.get("/grammar", authenticate, (req, res) => analyticsController.getGrammar(req, res));
router.get("/trends", authenticate, (req, res) => analyticsController.getTrends(req, res));
router.get("/ai-analysis", authenticate, (req, res) => analyticsController.getLatestAIAnalysis(req, res));
router.post("/ai-analysis", authenticate, aiRateLimiter(20), (req, res) =>
    analyticsController.triggerAIAnalysis(req, res)
);

export default router;
