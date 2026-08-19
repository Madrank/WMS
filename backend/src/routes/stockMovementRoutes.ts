import { Router } from "express";
import { list, create } from "../controllers/stockMovementController.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createMovementSchema } from "../validators/movementSchemas.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, validate(createMovementSchema), create);

export const movementRouter = router;