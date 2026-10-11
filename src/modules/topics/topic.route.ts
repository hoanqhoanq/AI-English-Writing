import { Router } from "express";
import { topicController } from "./topic.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";

// API Chủ đề, Chủ điểm ngữ pháp và Cấp độ CEFR — được gắn 2 lần trong src/app.ts
// (tại /api và /api/topics), nên mỗi route phản hồi ở cả hai tiền tố.
const router = Router();

// Public / Learner routes
// GET /topics — Danh sách chủ đề nội dung (Daily Life, Family, Work...) (công khai).
router.get("/topics", (req, res) => topicController.getTopics(req, res));
// GET /grammar — Danh sách chủ điểm ngữ pháp (công khai).
router.get("/grammar", (req, res) => topicController.getGrammar(req, res));
// GET /levels — 6 cấp độ CEFR (A1–C2) kèm số câu hỏi ở mỗi cấp (công khai).
router.get("/levels", (req, res) => topicController.getLevels(req, res));

// Admin CRUD routes
// POST /topics — Admin thêm chủ đề (chỉ admin).
router.post("/topics", authenticate, authorize("admin"), (req, res) => topicController.createTopic(req, res));
// PUT /topics/:id — Admin sửa chủ đề (chỉ admin).
router.put("/topics/:id", authenticate, authorize("admin"), (req, res) => topicController.updateTopic(req, res));
// DELETE /topics/:id — Admin xóa chủ đề (chỉ admin).
router.delete("/topics/:id", authenticate, authorize("admin"), (req, res) => topicController.deleteTopic(req, res));

// POST /grammar — Admin thêm chủ điểm ngữ pháp (chỉ admin).
router.post("/grammar", authenticate, authorize("admin"), (req, res) => topicController.createGrammar(req, res));
// PUT /grammar/:id — Admin sửa chủ điểm ngữ pháp (chỉ admin).
router.put("/grammar/:id", authenticate, authorize("admin"), (req, res) => topicController.updateGrammar(req, res));
// DELETE /grammar/:id — Admin xóa chủ điểm ngữ pháp (chỉ admin).
router.delete("/grammar/:id", authenticate, authorize("admin"), (req, res) => topicController.deleteGrammar(req, res));

export default router;

