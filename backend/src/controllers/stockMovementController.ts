import type { Request, Response } from "express";
import { stockMovementService } from "../services/stockMovementService.js";

export async function list(req: Request, res: Response) {
  const { articleId, locationId, type, userId, from, to, page = 1, limit = 20 } = req.query;

  const result = await stockMovementService.list({
    articleId: articleId ? Number(articleId) : undefined,
    locationId: locationId ? Number(locationId) : undefined,
    type: typeof type === "string" ? type : undefined,
    userId: userId ? Number(userId) : undefined,
    from: typeof from === "string" && from ? new Date(from) : undefined,
    to: typeof to === "string" && to ? new Date(to) : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  res.json(result);
}

export async function create(req: Request, res: Response) {
  const movement = await stockMovementService.create({
    type: req.body.type,
    articleId: Number(req.body.articleId),
    quantity: Number(req.body.quantity),
    sourceLocationId: req.body.sourceLocationId ? Number(req.body.sourceLocationId) : null,
    destinationLocationId: req.body.destinationLocationId ? Number(req.body.destinationLocationId) : null,
    userId: req.user!.userId,
    reason: req.body.reason ?? null,
  });
  res.status(201).json(movement);
}