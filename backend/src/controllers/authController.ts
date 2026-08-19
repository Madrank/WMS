import type { Request, Response } from "express";
import { authService } from "../services/authService.js";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
}

export async function logout(_req: Request, res: Response) {
  res.json({ message: "Déconnecté." });
}

export async function me(req: Request, res: Response) {
  const auth = (req as Request & { user?: { userId: number } }).user;
  const user = await authService.findById(auth?.userId ?? 0);

  if (!user) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Utilisateur introuvable." } });
    return;
  }

  res.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  });
}