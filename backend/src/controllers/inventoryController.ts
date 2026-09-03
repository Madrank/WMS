import type { Request, Response } from "express";
import { inventoryService } from "../services/inventoryService.js";
import { auditService } from "../services/auditService.js";

export async function list(req: Request, res: Response) {
  const { search, status, page = 1, limit = 20 } = req.query;

  const result = await inventoryService.list({
    search: typeof search === "string" ? search : undefined,
    status: typeof status === "string" ? status : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const inventory = await inventoryService.getById(Number(req.params.id));
  res.json(inventory);
}

export async function create(req: Request, res: Response) {
  const inventory = await inventoryService.create({
    reference: req.body.reference,
    locationId: Number(req.body.locationId),
    createdBy: req.user!.userId,
    items: req.body.items,
  });
  await auditService.log({
    userId: req.user!.userId,
    action: "CREATE",
    entityType: "inventory",
    entityId: inventory.id,
    description: `Création de l'inventaire ${inventory.reference}`,
  });
  res.status(201).json(inventory);
}

export async function validate(req: Request, res: Response) {
  const inventory = await inventoryService.validate(Number(req.params.id), req.user!.userId);
  await auditService.log({
    userId: req.user!.userId,
    action: "VALIDATE",
    entityType: "inventory",
    entityId: inventory.id,
    description: `Validation de l'inventaire ${inventory.reference}`,
  });
  res.json(inventory);
}