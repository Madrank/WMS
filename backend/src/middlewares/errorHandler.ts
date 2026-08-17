import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `Route introuvable : ${req.method} ${req.path}` },
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const apiError = err as { status?: number; code?: string; message?: string };

  const status = apiError.status ?? 500;
  const code = apiError.code ?? "INTERNAL_ERROR";
  const message = apiError.message ?? "Une erreur inattendue s'est produite.";

  res.status(status).json({ error: { code, message } });
}