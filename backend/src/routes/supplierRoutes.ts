import { Router } from "express";
import { list, getById, create, update, setActive } from "../controllers/supplierController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import { createSupplierSchema, updateSupplierSchema, setActiveSchema } from "../validators/supplierSchemas.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), validate(createSupplierSchema), create);
router.get("/:id", requireAuth, getById);
router.patch("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), validate(updateSupplierSchema), update);
router.delete("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), validate(setActiveSchema), setActive);

export const supplierRouter = router;