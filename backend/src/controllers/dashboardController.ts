import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboardService.js";

export async function summary(req: Request, res: Response) {
  const result = await dashboardService.getSummary();
  res.json(result);
}