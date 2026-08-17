import { Router } from "express";
import { list, getById, create, validate } from "../controllers/inventoryController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, create);
router.get("/:id", requireAuth, getById);
router.post("/:id/validate", requireAuth, validate);

export const inventoryRouter = router;