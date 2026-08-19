import { Router } from "express";
import { list, getById, getByArticle } from "../controllers/stockController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, list);
router.get("/by-article/:articleId", requireAuth, getByArticle);
router.get("/:id", requireAuth, getById);

export const stockRouter = router;