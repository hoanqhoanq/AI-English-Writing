import { Router } from "express";
import { journeyController } from "./journey.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/chapters", authenticate, (req, res) => journeyController.getChapters(req, res));
router.get("/chapters/:grammarTopicId", authenticate, (req, res) => journeyController.getChapterDetail(req, res));
router.get("/overview", authenticate, (req, res) => journeyController.getOverview(req, res));
router.get("/recommendations", authenticate, (req, res) => journeyController.getRecommendations(req, res));

export default router;
