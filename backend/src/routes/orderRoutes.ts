import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { list, detail, create, validate, ship, cancel } from "../controllers/orderController.js";

const router = Router();

router.use(requireAuth);

router.get("/", list);
router.get("/:id", detail);
router.post("/", create);
router.post("/:id/validate", validate);
router.post("/:id/ship", ship);
router.post("/:id/cancel", cancel);

export const orderRouter = router;
