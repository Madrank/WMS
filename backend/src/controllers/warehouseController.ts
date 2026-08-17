import type { Request, Response } from "express";
import { warehouseService } from "../services/warehouseService.js";

export async function list(req: Request, res: Response) {
  const { search, page = 1, limit = 20 } = req.query;

  const result = await warehouseService.list({
    search: typeof search === "string" ? search : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const warehouse = await warehouseService.getById(Number(req.params.id));
  res.json(warehouse);
}

export async function create(req: Request, res: Response) {
  const warehouse = await warehouseService.create(req.body);
  res.status(201).json(warehouse);
}

export async function update(req: Request, res: Response) {
  const warehouse = await warehouseService.update(Number(req.params.id), req.body);
  res.json(warehouse);
}

export async function remove(req: Request, res: Response) {
  const warehouse = await warehouseService.remove(Number(req.params.id));
  res.json(warehouse);
}