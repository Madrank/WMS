import type { Request, Response } from "express";
import { userService } from "../services/userService.js";
import { auditService } from "../services/auditService.js";

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
  await auditService.log({
    userId: req.user!.userId,
    action: "CREATE",
    entityType: "user",
    entityId: user.id,
    description: `Création du compte utilisateur ${user.firstName} ${user.lastName} (${user.role})`,
  });
  res.status(201).json(user);
}

export async function update(req: Request, res: Response) {
  const user = await userService.update(Number(req.params.id), req.body);
  await auditService.log({
    userId: req.user!.userId,
    action: "UPDATE",
    entityType: "user",
    entityId: user.id,
    description: `Modification du compte utilisateur ${user.firstName} ${user.lastName}`,
  });
  res.json(user);
}

export async function setActive(req: Request, res: Response) {
  const user = await userService.setActive(Number(req.params.id), req.body.active);
  await auditService.log({
    userId: req.user!.userId,
    action: req.body.active ? "ACTIVATE" : "DEACTIVATE",
    entityType: "user",
    entityId: user.id,
    description: `${req.body.active ? "Activation" : "Désactivation"} du compte utilisateur ${user.firstName} ${user.lastName}`,
  });
  res.json(user);
}