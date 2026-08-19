
import { api } from "../lib/api.js";

export interface Warehouse {
  id: number;
  name: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseInput {
  name: string;
  address?: string;
}

export async function listWarehouses() {
  const { data } = await api.get("/warehouses", { params: { limit: 100 } });
  return data as { data: Warehouse[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
}

export async function createWarehouse(input: WarehouseInput) {
const { data } = await api.post("/warehouses", input);
  return data as Warehouse;
}