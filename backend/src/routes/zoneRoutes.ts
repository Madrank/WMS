import { Router } from "express";
import { list, getById, create, update, remove } from "../controllers/zoneController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import { createZoneSchema, updateZoneSchema } from "../validators/zoneSchemas.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, requireRole("ADMIN"), validate(createZoneSchema), create);
router.get("/:id", requireAuth, getById);
router.patch("/:id", requireAuth, requireRole("ADMIN"), validate(updateZoneSchema), update);
router.delete("/:id", requireAuth, requireRole("ADMIN"), remove);

export const zoneRouter = router;