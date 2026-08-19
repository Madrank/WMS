import { z } from "zod";

export const createMovementSchema = z.object({
  type: z.enum(["IN", "OUT", "TRANSFER", "ADJUSTMENT"]),
  articleId: z.number().int().positive(),
  quantity: z.number().int().positive("La quantité doit être strictement positive."),
  sourceLocationId: z.number().int().positive().optional().nullable(),
  destinationLocationId: z.number().int().positive().optional().nullable(),
  reason: z.string().max(1000).optional().nullable(),
});