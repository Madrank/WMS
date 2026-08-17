import type { Request, Response } from "express";
import { locationService } from "../services/locationService.js";

export async function list(req: Request, res: Response) {
  const { zoneId, active, page = 1, limit = 20 } = req.query;

  const result = await locationService.list({
    zoneId: zoneId ? Number(zoneId) : undefined,
    active: active === "true" ? true : active === "false" ? false : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const location = await locationService.getById(Number(req.params.id));
  res.json(location);
}

export async function create(req: Request, res: Response) {
  const location = await locationService.create(req.body);
  res.status(201).json(location);
}

export async function update(req: Request, res: Response) {
  const location = await locationService.update(Number(req.params.id), req.body);
  res.json(location);
}

export async function setActive(req: Request, res: Response) {
  const location = await locationService.setActive(Number(req.params.id), req.body.active);
  res.json(location);
}