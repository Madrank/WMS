import { Router } from "express";
import { list, getById, create, update, setActive } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import { createUserSchema, updateUserSchema, setActiveSchema } from "../validators/userSchemas.js";
const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/", list);
router.post("/", validate(createUserSchema), create);
router.get("/:id", getById);
router.patch("/:id", validate(updateUserSchema), update);
router.delete("/:id", validate(setActiveSchema), setActive);

export const userRouter = router;