import { api } from "../lib/api.js";

export interface OrderItem {
  id: number;
  orderId: number;
  articleId: number;
  quantity: number;
  reference?: string | null;
  name?: string | null;
}

export interface Order {
  id: number;
  reference: string;
  customerName: string;
  status: string;
  createdBy: number;
  validatedAt: string | null;
  shippedAt: string | null;
  createdAt: string;
  items?: OrderItem[];
}

export async function listOrders(params: { search?: string; status?: string; page?: number; limit?: number } = {}) {
  const { data } = await api.get("/orders", { params });
  return data as {
    data: Order[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

export async function getOrder(id: number) {
  const { data } = await api.get(`/orders/${id}`);
  return data as Order;
}

export async function createOrder(payload: { reference?: string; customerName: string; items: { articleId: number; quantity: number }[] }) {
  const { data } = await api.post("/orders", payload);
  return data as Order;
}

export async function validateOrder(id: number) {
  const { data } = await api.post(`/orders/${id}/validate`);
  return data as Order;
}

export async function shipOrder(id: number) {
  const { data } = await api.post(`/orders/${id}/ship`);
  return data as Order;
}

export async function cancelOrder(id: number) {
  const { data } = await api.post(`/orders/${id}/cancel`);
  return data as Order;
}
