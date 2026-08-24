import { Router } from "express";
import { aiController } from "./ai.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { aiRateLimiter } from "../../middlewares/rateLimit.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { GenerateQuestionsSchema } from "./ai.validation";

const router = Router();

router.post("/generate-questions", authenticate, authorize("admin"), validate(GenerateQuestionsSchema), aiRateLimiter(20), (req, res) =>
    aiController.generateQuestions(req, res)
);
router.post("/evaluate-writing", authenticate, aiRateLimiter(60), (req, res) =>
    aiController.evaluateWriting(req, res)
);
router.post("/analyze-weakness", authenticate, aiRateLimiter(20), (req, res) =>
    aiController.analyzeWeakness(req, res)
);

export default router;
