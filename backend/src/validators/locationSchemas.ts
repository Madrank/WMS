import { z } from "zod";

const locationFields = {
  name: z.string().min(1, "Le nom est obligatoire.").max(255),
  code: z.string().min(1, "Le code est obligatoire.").max(50),
  capacity: z.number().int().positive().optional(),
  zoneId: z.number().int().positive(),
};

export const createLocationSchema = z.object(locationFields);
export const updateLocationSchema = z.object({ ...locationFields, active: z.boolean().optional() }).partial();
export const setActiveSchema = z.object({ active: z.boolean() });