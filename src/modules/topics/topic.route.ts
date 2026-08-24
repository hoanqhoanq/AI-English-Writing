import { Router } from "express";
import { topicController } from "./topic.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";

const router = Router();

// Public / Learner routes
router.get("/topics", (req, res) => topicController.getTopics(req, res));
router.get("/grammar", (req, res) => topicController.getGrammar(req, res));
router.get("/levels", (req, res) => topicController.getLevels(req, res));

// Admin CRUD routes
router.post("/topics", authenticate, authorize("admin"), (req, res) => topicController.createTopic(req, res));
router.put("/topics/:id", authenticate, authorize("admin"), (req, res) => topicController.updateTopic(req, res));
router.delete("/topics/:id", authenticate, authorize("admin"), (req, res) => topicController.deleteTopic(req, res));

router.post("/grammar", authenticate, authorize("admin"), (req, res) => topicController.createGrammar(req, res));
router.put("/grammar/:id", authenticate, authorize("admin"), (req, res) => topicController.updateGrammar(req, res));
router.delete("/grammar/:id", authenticate, authorize("admin"), (req, res) => topicController.deleteGrammar(req, res));

export default router;

