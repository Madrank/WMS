import { api } from "../lib/api.js";

export interface Article {
  id: number;
  reference: string;
  name: string;
  description: string | null;
  barcode: string | null;
  unit: string;
  minimumStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleInput {
  reference: string;
  name: string;
  description?: string;
  barcode?: string;
  unit?: string;
  minimumStock?: number;
}

export async function listArticles(params: { search?: string; active?: boolean; page?: number; limit?: number }) {
  const { data } = await api.get("/articles", { params });
  return data as { data: Article[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
}

export async function getArticle(id: number) {
  const { data } = await api.get(`/articles/${id}`);
  return data as Article;
}

export async function createArticle(input: ArticleInput) {
  const { data } = await api.post("/articles", input);
  return data as Article;
}

export async function updateArticle(id: number, input: Partial<ArticleInput>) {
  const { data } = await api.patch(`/articles/${id}`, input);
  return data as Article;
}

export async function deactivateArticle(id: number) {
  const { data } = await api.delete(`/articles/${id}`, { data: { active: false } });
  return data as Article;
}