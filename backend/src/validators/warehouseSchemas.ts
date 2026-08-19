import { z } from "zod";

const warehouseFields = {
  name: z.string().min(1, "Le nom est obligatoire.").max(255),
  address: z.string().max(255).optional(),
};

export const createWarehouseSchema = z.object(warehouseFields);
export const updateWarehouseSchema = z.object(warehouseFields).partial();