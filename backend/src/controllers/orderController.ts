import type { Request, Response } from "express";
import { orderService } from "../services/orderService.js";
import { auditService } from "../services/auditService.js";
import { broadcast } from "../websocket.js";

export async function list(req: Request, res: Response) {
  const { search, status } = req.query;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await orderService.list({
    search: typeof search === "string" ? search : undefined,
    status: typeof status === "string" ? status : undefined,
    page,
    limit,
  });
  res.json(result);
}

export async function detail(req: Request, res: Response) {
  const order = await orderService.detail(Number(req.params.id));
  res.json(order);
}

export async function create(req: Request, res: Response) {
  const reference =
    typeof req.body.reference === "string" && req.body.reference
      ? req.body.reference
      : `ORD-${Date.now()}`;
  const order = await orderService.create({
    reference,
    customerName: req.body.customerName,
    userId: req.user!.userId,
    items: req.body.items ?? [],
  });
  await auditService.log({
    userId: req.user!.userId,
    action: "CREATE",
    entityType: "order",
    entityId: order.id,
    description: `Création de la commande ${order.reference}`,
  });
  res.status(201).json(order);
}

export async function validate(req: Request, res: Response) {
  const order = await orderService.validate(Number(req.params.id), req.user!.userId);
  await auditService.log({
    userId: req.user!.userId,
    action: "VALIDATE",
    entityType: "order",
    entityId: order.id,
    description: `Validation de la commande ${order.reference}`,
  });
  res.json(order);
}

export async function ship(req: Request, res: Response) {
  const order = await orderService.ship(Number(req.params.id), req.user!.userId);
  await auditService.log({
    userId: req.user!.userId,
    action: "VALIDATE",
    entityType: "order",
    entityId: order.id,
    description: `Expédition de la commande ${order.reference}`,
  });
  broadcast("STOCK_UPDATED", { orderId: order.id });
  res.json(order);
}

export async function cancel(req: Request, res: Response) {
  const order = await orderService.cancel(Number(req.params.id), req.user!.userId);
  await auditService.log({
    userId: req.user!.userId,
    action: "ACTIVATE",
    entityType: "order",
    entityId: order.id,
    description: `Annulation de la commande ${order.reference}`,
  });
  res.json(order);
}
