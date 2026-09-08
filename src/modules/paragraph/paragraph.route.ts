import { Router } from "express";
import { paragraphController } from "./paragraph.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { aiRateLimiter } from "../../middlewares/rateLimit.middleware";
import { CreateParagraphTopicSchema, SubmitParagraphAttemptSchema, UpdateParagraphTopicSchema } from "./paragraph.validation";

const router = Router();

// Topic routes (public read, matches /writing/questions being public)
router.get("/topics", (req, res) => paragraphController.getTopics(req, res));
router.get("/topics/:id", (req, res) => paragraphController.getTopicById(req, res));

// Admin topic management
router.get("/admin/topics", authenticate, authorize("admin"), (req, res) => paragraphController.getAdminTopics(req, res));
router.post("/admin/topics", authenticate, authorize("admin"), validate(CreateParagraphTopicSchema), (req, res) =>
    paragraphController.createTopic(req, res)
);
router.put("/admin/topics/:id", authenticate, authorize("admin"), validate(UpdateParagraphTopicSchema), (req, res) =>
    paragraphController.updateTopic(req, res)
);
router.delete("/admin/topics/:id", authenticate, authorize("admin"), (req, res) => paragraphController.deleteTopic(req, res));
router.get("/admin/attempts", authenticate, authorize("admin"), (req, res) => paragraphController.getAdminAttempts(req, res));

// Attempt routes (reuses the same aiRateLimiter ceiling as /writing/attempts)
router.post("/attempts", authenticate, aiRateLimiter(60), validate(SubmitParagraphAttemptSchema), (req, res) =>
    paragraphController.submitAttempt(req, res)
);
router.get("/attempts", authenticate, (req, res) => paragraphController.getMyAttempts(req, res));
router.get("/attempts/:topicId", authenticate, (req, res) => paragraphController.getMyAttemptForTopic(req, res));

export default router;
