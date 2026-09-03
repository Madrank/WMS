import type { Request, Response } from "express";
import { auditService } from "../services/auditService.js";

export async function list(req: Request, res: Response) {
  const { userId, action, search, page = 1, limit = 20 } = req.query;

  const result = await auditService.list({
    userId: userId ? Number(userId) : undefined,
    action: typeof action === "string" ? action : undefined,
    search: typeof search === "string" ? search : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  res.json(result);
}
