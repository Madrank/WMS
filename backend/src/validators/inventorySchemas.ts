import { z } from "zod";

const inventoryItemSchema = z.object({
  articleId: z.number().int().positive(),
  theoreticalQuantity: z.number().int().nonnegative(),
  countedQuantity: z.number().int().nonnegative(),
});

export const createInventorySchema = z.object({
  reference: z.string().min(1, "La référence est obligatoire.").max(50),
  locationId: z.number().int().positive(),
  items: z.array(inventoryItemSchema).min(1, "Au moins un article."),
});