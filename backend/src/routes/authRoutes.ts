import { Router } from "express";
import { login, logout, me } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema } from "../validators/authSchemas.js";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export const authRouter = router;