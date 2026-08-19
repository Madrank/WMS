import { z } from "zod";

const zoneFields = {
  name: z.string().min(1, "Le nom est obligatoire.").max(255),
  code: z.string().min(1, "Le code est obligatoire.").max(20),
  warehouseId: z.number().int().positive(),
};

export const createZoneSchema = z.object(zoneFields);
export const updateZoneSchema = z.object(zoneFields).partial();