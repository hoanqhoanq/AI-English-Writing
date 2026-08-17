import { Router } from "express";
import { authController } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { authenticate } from "../../middlewares/auth.middleware";
import { RegisterSchema, LoginSchema } from "./auth.validation";

const router = Router();

router.post("/register", validate(RegisterSchema), (req, res) => authController.register(req, res));
router.post("/login", validate(LoginSchema), (req, res) => authController.login(req, res));
router.post("/logout", (req, res) => authController.logout(req, res));
router.get("/me", authenticate, (req, res) => authController.getMe(req, res));
router.post("/refresh", authenticate, (req, res) => authController.getMe(req, res));

export default router;
