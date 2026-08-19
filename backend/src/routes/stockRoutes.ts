import { Router } from "express";
import { list, getByArticle } from "../controllers/stockController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, list);
router.get("/by-article/:articleId", requireAuth, getByArticle);
router.get("/:articleId", requireAuth, getByArticle);

export const stockRouter = router;