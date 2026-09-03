import { Router } from "express";
import { list } from "../controllers/auditController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/", list);

export const auditRouter = router;
