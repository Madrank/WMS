import { api } from "../lib/api.js";

export interface Location {
  id: number;
  name: string;
  code: string;
  capacity: number;
  zoneId: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationInput {
  name: string;
  code: string;
  capacity?: number;
  zoneId: number;
}

export async function listLocations(params: { zoneId?: number; limit?: number } = {}) {
  const { data } = await api.get("/locations", { params });
  return data as { data: Location[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
}

export async function createLocation(input: LocationInput) {
  const { data } = await api.post("/locations", input);
  return data as Location;
}

export async function deactivateLocation(id: number) {
  const { data } = await api.delete(`/locations/${id}`, { data: { active: false } });
  return data as Location;
}