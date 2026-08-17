import { Router } from "express";
import { list, create } from "../controllers/stockMovementController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, create);

export const movementRouter = router;