import { Router } from "express";
import { list, getById, create, update, remove } from "../controllers/warehouseController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, create);
router.get("/:id", requireAuth, getById);
router.patch("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);

export const warehouseRouter = router;