import type { Request, Response } from "express";
import { stockMovementService } from "../services/stockMovementService.js";
import { toCsv } from "../utils/csv.js";
import { broadcast } from "../websocket.js";

export async function list(req: Request, res: Response) {
  const { articleId, locationId, type, userId, search, from, to, page = 1, limit = 20 } = req.query;

  const result = await stockMovementService.list({
    articleId: articleId ? Number(articleId) : undefined,
    locationId: locationId ? Number(locationId) : undefined,
    type: typeof type === "string" ? type : undefined,
    userId: userId ? Number(userId) : undefined,
    search: typeof search === "string" ? search : undefined,
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
  broadcast("STOCK_UPDATED", { movementId: movement.id });
  res.status(201).json(movement);
}

const TYPE_LABELS: Record<string, string> = {
  IN: "Entrée",
  OUT: "Sortie",
  TRANSFER: "Transfert",
  ADJUSTMENT: "Ajustement",
};

export async function exportCsv(req: Request, res: Response) {
  const result = await stockMovementService.list({ page: 1, limit: 10000 });
  const rows = result.data.map((m) => ({
    date: new Date(m.createdAt).toISOString(),
    type: TYPE_LABELS[m.type] ?? m.type,
    articleId: m.articleId,
    quantity: m.quantity,
    sourceLocationId: m.sourceLocationId ?? "",
    destinationLocationId: m.destinationLocationId ?? "",
    userId: m.userId,
    reason: m.reason ?? "",
  }));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="mouvements.csv"');
  res.send(toCsv(rows));
}