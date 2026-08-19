import { Router } from "express";
import { list, getById, create, validate } from "../controllers/inventoryController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate as validateBody } from "../middlewares/validate.js";
import { createInventorySchema } from "../validators/inventorySchemas.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, validateBody(createInventorySchema), create);
router.get("/:id", requireAuth, getById);
router.post("/:id/validate", requireAuth, requireRole("ADMIN", "MANAGER"), validate);

export const inventoryRouter = router;