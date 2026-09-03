import type { Request, Response } from "express";
import { supplierService } from "../services/supplierService.js";
import { auditService } from "../services/auditService.js";

export async function list(req: Request, res: Response) {
  const { search, page = 1, limit = 20 } = req.query;

  const result = await supplierService.list({
    search: typeof search === "string" ? search : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const supplier = await supplierService.getById(Number(req.params.id));
  res.json(supplier);
}

export async function create(req: Request, res: Response) {
  const supplier = await supplierService.create(req.body);
  await auditService.log({
    userId: req.user!.userId,
    action: "CREATE",
    entityType: "supplier",
    entityId: supplier.id,
    description: `Création du fournisseur ${supplier.name}`,
  });
  res.status(201).json(supplier);
}

export async function update(req: Request, res: Response) {
  const supplier = await supplierService.update(Number(req.params.id), req.body);
  await auditService.log({
    userId: req.user!.userId,
    action: "UPDATE",
    entityType: "supplier",
    entityId: supplier.id,
    description: `Modification du fournisseur ${supplier.name}`,
  });
  res.json(supplier);
}

export async function setActive(req: Request, res: Response) {
  const supplier = await supplierService.setActive(Number(req.params.id), req.body.active);
  await auditService.log({
    userId: req.user!.userId,
    action: req.body.active ? "ACTIVATE" : "DEACTIVATE",
    entityType: "supplier",
    entityId: supplier.id,
    description: `${req.body.active ? "Activation" : "Désactivation"} du fournisseur ${supplier.name}`,
  });
  res.json(supplier);
}