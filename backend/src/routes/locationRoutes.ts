import { Router } from "express";
import { list, getById, create, update, setActive } from "../controllers/locationController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import { createLocationSchema, updateLocationSchema, setActiveSchema } from "../validators/locationSchemas.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), validate(createLocationSchema), create);
router.get("/:id", requireAuth, getById);
router.patch("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), validate(updateLocationSchema), update);
router.delete("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), validate(setActiveSchema), setActive);

export const locationRouter = router;