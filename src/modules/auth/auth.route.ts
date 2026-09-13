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
// Reads the refresh token from the HttpOnly cookie, not the access token, so it
// intentionally does NOT go through `authenticate` (the access token may already be expired).
router.post("/refresh", (req, res) => authController.refresh(req, res));

// Admin portal — separate endpoints so its refresh-token cookie never overlaps
// with the User portal's, and so login itself rejects non-admin credentials.
router.post("/admin/login", validate(LoginSchema), (req, res) => authController.adminLogin(req, res));
router.post("/admin/refresh", (req, res) => authController.adminRefresh(req, res));
router.post("/admin/logout", (req, res) => authController.adminLogout(req, res));

export default router;
