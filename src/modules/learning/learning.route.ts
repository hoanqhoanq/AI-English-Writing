import { Router } from "express";
import { learningController } from "./learning.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { aiRateLimiter } from "../../middlewares/rateLimit.middleware";
import {
    CreateLearningTopicSchema,
    GenerateAIWritingQuestionSchema,
    MarkSectionViewedSchema,
    UpdateLearningTopicSchema,
} from "./learning.validation";

const router = Router();

// User routes — every topic is always readable, nothing is ever locked.
router.get("/topics", authenticate, (req, res) => learningController.getTopics(req, res));
router.get("/topics/:slug", authenticate, (req, res) => learningController.getTopicDetail(req, res));
router.post("/topics/:slug/progress/section-viewed", authenticate, validate(MarkSectionViewedSchema), (req, res) =>
    learningController.markSectionViewed(req, res)
);
router.get("/progress-overview", authenticate, (req, res) => learningController.getProgressOverview(req, res));

// AI Writing — reuses the shared aiService.generateQuestions() under the hood,
// never calls Gemini automatically, only on this explicit user-triggered request.
router.get("/ai-writing/topics", authenticate, (req, res) => learningController.getAIWritingTopics(req, res));
router.post(
    "/ai-writing/generate",
    authenticate,
    aiRateLimiter(60),
    validate(GenerateAIWritingQuestionSchema),
    (req, res) => learningController.generateAIWritingQuestion(req, res)
);

// Admin CMS
router.get("/admin/topics", authenticate, authorize("admin"), (req, res) => learningController.getAdminTopics(req, res));
router.post("/admin/topics", authenticate, authorize("admin"), validate(CreateLearningTopicSchema), (req, res) =>
    learningController.createTopic(req, res)
);
router.put("/admin/topics/:id", authenticate, authorize("admin"), validate(UpdateLearningTopicSchema), (req, res) =>
    learningController.updateTopic(req, res)
);
router.delete("/admin/topics/:id", authenticate, authorize("admin"), (req, res) => learningController.deleteTopic(req, res));

export default router;
