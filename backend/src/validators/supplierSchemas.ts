import { z } from "zod";

const supplierFields = {
  name: z.string().min(1, "Le nom est obligatoire.").max(255),
  email: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().email("Email invalide.").max(255).optional(),
  ),
  phone: z.string().max(50).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
};

export const createSupplierSchema = z.object(supplierFields);
export const updateSupplierSchema = z.object({ ...supplierFields, active: z.boolean().optional() }).partial();
export const setActiveSchema = z.object({ active: z.boolean() });