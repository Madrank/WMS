import type { Request, Response } from "express";
import { receiptService } from "../services/receiptService.js";
import { auditService } from "../services/auditService.js";
import { broadcast } from "../websocket.js";

export async function list(req: Request, res: Response) {
  const { search, status, page = 1, limit = 20 } = req.query;

  const result = await receiptService.list({
    search: typeof search === "string" ? search : undefined,
    status: typeof status === "string" ? status : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const receipt = await receiptService.getById(Number(req.params.id));
  res.json(receipt);
}

export async function create(req: Request, res: Response) {
  const receipt = await receiptService.create({
    reference: req.body.reference,
    supplierId: Number(req.body.supplierId),
    createdBy: req.user!.userId,
    items: req.body.items,
  });
  await auditService.log({
    userId: req.user!.userId,
    action: "CREATE",
    entityType: "receipt",
    entityId: receipt.id,
    description: `Création de la réception ${receipt.reference}`,
  });
  res.status(201).json(receipt);
}

export async function validate(req: Request, res: Response) {
  const receipt = await receiptService.validate(Number(req.params.id), req.user!.userId);
  await auditService.log({
    userId: req.user!.userId,
    action: "VALIDATE",
    entityType: "receipt",
    entityId: receipt.id,
    description: `Validation de la réception ${receipt.reference}`,
  });
  broadcast("STOCK_UPDATED", { receiptId: receipt.id });
  res.json(receipt);
}