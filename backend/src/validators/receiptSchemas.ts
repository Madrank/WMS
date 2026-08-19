import { z } from "zod";

const receiptItemSchema = z.object({
  articleId: z.number().int().positive(),
  expectedQuantity: z.number().int().positive("La quantité prévue doit être positive."),
  receivedQuantity: z.number().int().nonnegative().optional(),
  locationId: z.number().int().positive(),
});

export const createReceiptSchema = z.object({
  reference: z.string().min(1, "La référence est obligatoire.").max(50),
  supplierId: z.number().int().positive(),
  items: z.array(receiptItemSchema).min(1, "Au moins une ligne."),
});