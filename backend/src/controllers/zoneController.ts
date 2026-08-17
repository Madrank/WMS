import type { Request, Response } from "express";
import { zoneService } from "../services/zoneService.js";

export async function list(req: Request, res: Response) {
  const { warehouseId, page = 1, limit = 20 } = req.query;

  const result = await zoneService.list({
    warehouseId: warehouseId ? Number(warehouseId) : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const zone = await zoneService.getById(Number(req.params.id));
  res.json(zone);
}

export async function create(req: Request, res: Response) {
  const zone = await zoneService.create(req.body);
  res.status(201).json(zone);
}

export async function update(req: Request, res: Response) {
  const zone = await zoneService.update(Number(req.params.id), req.body);
  res.json(zone);
}

export async function remove(req: Request, res: Response) {
  const zone = await zoneService.remove(Number(req.params.id));
  res.json(zone);
}