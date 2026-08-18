import { Router } from "express";
import { list, getById, create, update, remove } from "../controllers/zoneController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, requireRole("ADMIN"), create);
router.get("/:id", requireAuth, getById);
router.patch("/:id", requireAuth, requireRole("ADMIN"), update);
router.delete("/:id", requireAuth, requireRole("ADMIN"), remove);

export const zoneRouter = router;