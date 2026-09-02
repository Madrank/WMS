import { Router } from "express";
import { list, getByArticle, exportCsv } from "../controllers/stockController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, list);
router.get("/export", requireAuth, exportCsv);
router.get("/by-article/:articleId", requireAuth, getByArticle);
router.get("/:articleId", requireAuth, getByArticle);

export const stockRouter = router;