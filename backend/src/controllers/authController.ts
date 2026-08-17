import type { Request, Response } from "express";
import { authService } from "../services/authService.js";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
}