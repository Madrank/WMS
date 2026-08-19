import { z } from "zod";

const roleSchema = z.enum(["ADMIN", "MANAGER", "OPERATOR"]);

export const createUserSchema = z.object({
  firstName: z.string().min(1, "Le prénom est obligatoire.").max(100),
  lastName: z.string().min(1, "Le nom est obligatoire.").max(100),
  email: z.string().email("Email invalide.").max(255),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").max(255),
  role: roleSchema,
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email("Email invalide.").max(255).optional(),
  password: z.string().min(8).max(255).optional(),
  role: roleSchema.optional(),
});
export const setActiveSchema = z.object({ active: z.boolean() });