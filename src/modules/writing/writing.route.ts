import { Router } from "express";
import { writingController } from "./writing.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { aiRateLimiter } from "../../middlewares/rateLimit.middleware";
import { CreateSessionSchema, SubmitAttemptSchema } from "./writing.validation";

const router = Router();

// Question routes
router.get("/questions", (req, res) => writingController.getQuestions(req, res));
router.get("/questions/:id", (req, res) => writingController.getQuestionById(req, res));

// Admin Question & Evaluation routes
router.get("/admin/questions", authenticate, (req, res) => writingController.getAdminQuestions(req, res));
router.post("/admin/questions", authenticate, (req, res) => writingController.createQuestion(req, res));
router.put("/admin/questions/:id", authenticate, (req, res) => writingController.updateQuestion(req, res));
router.delete("/admin/questions/:id", authenticate, (req, res) => writingController.deleteQuestion(req, res));
router.get("/admin/evaluations", authenticate, (req, res) => writingController.getAdminEvaluations(req, res));

// Session routes
router.post("/sessions", authenticate, validate(CreateSessionSchema), (req, res) =>
    writingController.createSession(req, res)
);
router.get("/sessions/:id", authenticate, (req, res) => writingController.getSessionById(req, res));

// Attempt & Evaluation routes
router.post("/attempts", authenticate, aiRateLimiter(60), validate(SubmitAttemptSchema), (req, res) =>
    writingController.submitAttempt(req, res)
);
router.get("/attempts/:id", authenticate, (req, res) => writingController.getAttemptById(req, res));

export default router;
