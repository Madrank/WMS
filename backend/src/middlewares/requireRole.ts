import type { NextFunction, Request, Response } from "express";

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Jeton manquant. Connectez-vous." },
      });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        error: { code: "FORBIDDEN", message: "Accès refusé : rôle insuffisant." },
      });
      return;
    }

    next();
  };
}