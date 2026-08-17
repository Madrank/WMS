import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Jeton manquant. Connectez-vous." },
    });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    (req as Request & { user?: { userId: number; role: string } }).user = payload;
    next();
  } catch {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Jeton invalide ou expiré." },
    });
    return;
  }
}