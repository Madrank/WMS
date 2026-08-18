import type { Request, Response } from "express";
import { userService } from "../services/userService.js";

export async function list(req: Request, res: Response) {
  const { search, active, page = 1, limit = 20 } = req.query;

  const activeFilter = active === "true" ? true : active === "false" ? false : undefined;

  const result = await userService.list({
    search: typeof search === "string" ? search : undefined,
    active: activeFilter,
    page: Number(page),
    limit: Number(limit),
  });

  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const user = await userService.getById(Number(req.params.id));
  res.json(user);
}

export async function create(req: Request, res: Response) {
  const user = await userService.create(req.body);
  res.status(201).json(user);
}

export async function update(req: Request, res: Response) {
  const user = await userService.update(Number(req.params.id), req.body);
  res.json(user);
}

export async function setActive(req: Request, res: Response) {
  const user = await userService.setActive(Number(req.params.id), req.body.active);
  res.json(user);
}