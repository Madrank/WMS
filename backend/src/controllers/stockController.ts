import type { Request, Response } from "express";
import { stockRepository } from "../repositories/stockRepository.js";
import { articleRepository } from "../repositories/articleRepository.js";
import { locationRepository } from "../repositories/locationRepository.js";
import { toCsv } from "../utils/csv.js";

export async function list(req: Request, res: Response) {
  const { articleId, locationId, zoneId, search, page = 1, limit = 20 } = req.query;

  const result = await stockRepository.findAll({
    articleId: articleId ? Number(articleId) : undefined,
    locationId: locationId ? Number(locationId) : undefined,
    zoneId: zoneId ? Number(zoneId) : undefined,
    search: typeof search === "string" ? search : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  res.json({
    data: result.rows,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: result.total,
      totalPages: Math.ceil(result.total / Number(limit)),
    },
  });
}

export async function getByArticle(req: Request, res: Response) {
  const result = await stockRepository.findAll({ articleId: Number(req.params.articleId) });
  res.json(result.rows);
}

export async function exportCsv(req: Request, res: Response) {
  const result = await stockRepository.findAll({ page: 1, limit: 10000 });
  const articleIds = [...new Set(result.rows.map((s) => s.articleId))];
  const locationIds = [...new Set(result.rows.map((s) => s.locationId))];
  const articleMap = new Map<number, string>();
  const locationMap = new Map<number, string>();
  for (const id of articleIds) {
    const a = await articleRepository.findById(id);
    if (a) articleMap.set(id, `${a.reference} — ${a.name}`);
  }
  for (const id of locationIds) {
    const l = await locationRepository.findById(id);
    if (l) locationMap.set(id, l.code);
  }
  const rows = result.rows.map((s) => ({
    article: articleMap.get(s.articleId) ?? String(s.articleId),
    location: locationMap.get(s.locationId) ?? String(s.locationId),
    quantity: s.quantity,
  }));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="stock.csv"');
  res.send(toCsv(rows));
}