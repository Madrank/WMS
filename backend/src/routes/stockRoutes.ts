import { Router } from "express";
import { list, getById } from "../controllers/stockController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, list);
router.get("/:id", requireAuth, getById);

export const stockRouter = router;