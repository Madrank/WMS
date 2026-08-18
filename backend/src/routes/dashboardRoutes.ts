import { Router } from "express";
import { summary } from "../controllers/dashboardController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, summary);

export const dashboardRouter = router;