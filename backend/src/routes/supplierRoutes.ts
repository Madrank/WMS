import { Router } from "express";
import { list, getById, create, update, setActive } from "../controllers/supplierController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), create);
router.get("/:id", requireAuth, getById);
router.patch("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), update);
router.delete("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), setActive);

export const supplierRouter = router;