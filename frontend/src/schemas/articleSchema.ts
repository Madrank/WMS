import { z } from "zod";

export const articleSchema = z.object({
  reference: z.string().min(1, "La référence est requise").max(50),
  name: z.string().min(1, "Le nom est requis").max(255),
  description: z.string().optional(),
  barcode: z.string().max(100).optional(),
  unit: z.string().min(1, "L'unité est requise").max(20),
  minimumStock: z.coerce.number().min(0, "Le minimum doit être positif"),
});

export type ArticleFormValues = z.output<typeof articleSchema>;
export type ArticleFormInput = z.input<typeof articleSchema>;