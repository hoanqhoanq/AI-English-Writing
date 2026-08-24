import { Router } from "express";
import { userController } from "./user.controller";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { UpdateProfileSchema } from "../auth/auth.validation";

const router = Router();

// Profile endpoints
router.get("/profile", authenticate, (req, res) => userController.getProfile(req, res));
router.put("/profile", authenticate, validate(UpdateProfileSchema), (req, res) =>
    userController.updateProfile(req, res)
);

// Admin management endpoints
router.get("/all", authenticate, authorize("admin"), (req, res) => userController.getAllUsers(req, res));
router.post("/", authenticate, authorize("admin"), (req, res) => userController.createUser(req, res));
router.put("/:id/status", authenticate, authorize("admin"), (req, res) => userController.toggleUserStatus(req, res));
router.put("/:id", authenticate, authorize("admin"), (req, res) => userController.updateUser(req, res));
router.delete("/:id", authenticate, authorize("admin"), (req, res) => userController.deleteUser(req, res));

export default router;

