import type { Request, Response } from "express";
import { stockRepository } from "../repositories/stockRepository.js";

export async function list(req: Request, res: Response) {
  const { articleId, locationId, zoneId, page = 1, limit = 20 } = req.query;

  const result = await stockRepository.findAll({
    articleId: articleId ? Number(articleId) : undefined,
    locationId: locationId ? Number(locationId) : undefined,
    zoneId: zoneId ? Number(zoneId) : undefined,
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