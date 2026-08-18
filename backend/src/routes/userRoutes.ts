import { Router } from "express";
import { list, getById, create, update, setActive } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/", list);
router.post("/", create);
router.get("/:id", getById);
router.patch("/:id", update);
router.delete("/:id", setActive);

export const userRouter = router;