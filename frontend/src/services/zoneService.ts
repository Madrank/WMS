import { api } from "../lib/api.js";

export interface Zone {
  id: number;
  name: string;
  code: string;
  warehouseId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ZoneInput {
  name: string;
  code: string;
  warehouseId: number;
}

export async function listZones() {
  const { data } = await api.get("/zones", { params: { limit: 100 } });
  return data as { data: Zone[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
}

export async function createZone(input: ZoneInput) {
  const { data } = await api.post("/zones", input);
  return data as Zone;
}