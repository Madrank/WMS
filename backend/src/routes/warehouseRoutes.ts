import { Router } from "express";
import { list, getById, create, update, remove } from "../controllers/warehouseController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import { createWarehouseSchema, updateWarehouseSchema } from "../validators/warehouseSchemas.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, requireRole("ADMIN"), validate(createWarehouseSchema), create);
router.get("/:id", requireAuth, getById);
router.patch("/:id", requireAuth, requireRole("ADMIN"), validate(updateWarehouseSchema), update);
router.delete("/:id", requireAuth, requireRole("ADMIN"), remove);

export const warehouseRouter = router;