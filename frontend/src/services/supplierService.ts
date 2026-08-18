import { api } from "../lib/api.js";

export interface Supplier {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export async function listSuppliers(params: { search?: string; page?: number; limit?: number }) {
  const { data } = await api.get("/suppliers", { params });
  return data as { data: Supplier[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
}

export async function createSupplier(input: SupplierInput) {
  const { data } = await api.post("/suppliers", input);
  return data as Supplier;
}

export async function deactivateSupplier(id: number) {
  const { data } = await api.delete(`/suppliers/${id}`, { data: { active: false } });
  return data as Supplier;
}