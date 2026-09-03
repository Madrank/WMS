import { api } from "../lib/api.js";

export interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  description: string;
  createdAt: string;
  userFirstName: string | null;
  userLastName: string | null;
}

export async function listAuditLogs(params: { search?: string; page?: number; limit?: number } = {}) {
  const { data } = await api.get("/audit-logs", { params });
  return data as {
    data: AuditLog[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}
