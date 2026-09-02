import { Router } from "express";
import { list, getById, create, update, setActive, exportCsv } from "../controllers/articleController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { validate } from "../middlewares/validate.js";
import { createArticleSchema, updateArticleSchema, setActiveSchema } from "../validators/articleSchemas.js";

const router = Router();

router.get("/", requireAuth, list);
router.post("/", requireAuth, requireRole("ADMIN", "MANAGER"), validate(createArticleSchema), create);
router.get("/export", requireAuth, exportCsv);
router.get("/:id", requireAuth, getById);
router.patch("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), validate(updateArticleSchema), update);
router.delete("/:id", requireAuth, requireRole("ADMIN", "MANAGER"), validate(setActiveSchema), setActive);

export const articleRouter = router;