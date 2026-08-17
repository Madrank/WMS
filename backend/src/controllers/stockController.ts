import type { Request, Response } from "express";
import { stockRepository } from "../repositories/stockRepository.js";

export async function list(req: Request, res: Response) {
  const { articleId, locationId, page = 1, limit = 20 } = req.query;

  const result = await stockRepository.findAll({
    articleId: articleId ? Number(articleId) : undefined,
    locationId: locationId ? Number(locationId) : undefined,
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

export async function getById(req: Request, res: Response) {
  const stock = await stockRepository.findById(Number(req.params.id));
  if (!stock) {
    throw { status: 404, code: "STOCK_NOT_FOUND", message: "Stock introuvable." };
  }
  res.json(stock);
}