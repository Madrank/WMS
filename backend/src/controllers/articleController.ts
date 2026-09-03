import type { Request, Response } from "express";
import { articleService } from "../services/articleService.js";
import { auditService } from "../services/auditService.js";
import { toCsv } from "../utils/csv.js";

export async function list(req: Request, res: Response) {
  const { search, active, barcode, page = 1, limit = 20 } = req.query;

  const activeFilter = active === "true" ? true : active === "false" ? false : undefined;

  const result = await articleService.list({
    search: typeof search === "string" ? search : undefined,
    active: activeFilter,
    barcode: typeof barcode === "string" ? barcode : undefined,
    page: Number(page),
    limit: Number(limit),
  });

  res.json(result);
}

export async function getById(req: Request, res: Response) {
  const article = await articleService.getById(Number(req.params.id));
  res.json(article);
}

export async function create(req: Request, res: Response) {
  const article = await articleService.create(req.body);
  await auditService.log({
    userId: req.user!.userId,
    action: "CREATE",
    entityType: "article",
    entityId: article.id,
    description: `Création du produit ${article.reference} — ${article.name}`,
  });
  res.status(201).json(article);
}

export async function update(req: Request, res: Response) {
  const article = await articleService.update(Number(req.params.id), req.body);
  await auditService.log({
    userId: req.user!.userId,
    action: "UPDATE",
    entityType: "article",
    entityId: article.id,
    description: `Modification du produit ${article.reference} — ${article.name}`,
  });
  res.json(article);
}

export async function setActive(req: Request, res: Response) {
  const article = await articleService.setActive(Number(req.params.id), req.body.active);
  await auditService.log({
    userId: req.user!.userId,
    action: req.body.active ? "ACTIVATE" : "DEACTIVATE",
    entityType: "article",
    entityId: article.id,
    description: `${req.body.active ? "Activation" : "Désactivation"} du produit ${article.reference} — ${article.name}`,
  });
  res.json(article);
}

export async function exportCsv(req: Request, res: Response) {
  const result = await articleService.list({ page: 1, limit: 10000 });
  const rows = result.data.map((a) => ({
    reference: a.reference,
    name: a.name,
    description: a.description ?? "",
    barcode: a.barcode ?? "",
    unit: a.unit,
    minimumStock: a.minimumStock,
    active: a.active ? "oui" : "non",
    createdAt: new Date(a.createdAt).toISOString(),
  }));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="articles.csv"');
  res.send(toCsv(rows));
}