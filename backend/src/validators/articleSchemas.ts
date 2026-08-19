import { z } from "zod";

const articleFields = {
  reference: z.string().min(1, "La référence est obligatoire.").max(50),
  name: z.string().min(1, "Le nom est obligatoire.").max(255),
  description: z.string().max(2000).optional(),
  barcode: z.string().max(100).optional(),
  unit: z.string().max(20).optional(),
  minimumStock: z.number().int("Minimum stock entier.").nonnegative("Minimum stock >= 0.").optional(),
};

export const createArticleSchema = z.object(articleFields);
export const updateArticleSchema = z.object({ ...articleFields, active: z.boolean().optional() }).partial();
export const setActiveSchema = z.object({ active: z.boolean() });