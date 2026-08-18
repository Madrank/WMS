import { api } from "../lib/api.js";

export interface LoginResponse {
  token: string;
  user: { userId: number; role: string };
}

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
  return data;
}