import { api } from "../lib/api.js";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}

export interface UserUpdateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
}

export async function listUsers(params: { search?: string; page?: number; limit?: number } = {}) {
  const { data } = await api.get("/users", { params });
  return data as { data: User[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
}

export async function createUser(input: UserInput) {
  const { data } = await api.post("/users", input);
  return data as User;
}

export async function updateUser(id: number, input: UserUpdateInput) {
  const { data } = await api.patch(`/users/${id}`, input);
  return data as User;
}

export async function deactivateUser(id: number) {
  const { data } = await api.delete(`/users/${id}`, { data: { active: false } });
  return data as User;
}