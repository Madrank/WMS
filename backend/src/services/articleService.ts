import { articleRepository } from "../repositories/articleRepository.js";

export const articleService = {
  async list({ search, active, barcode, page = 1, limit = 20 }: { search?: string; active?: boolean; barcode?: string; page?: number; limit?: number }) {
    const { rows, total } = await articleRepository.findAll({ search, active, barcode, page, limit });
    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: number) {
    const article = await articleRepository.findById(id);
    if (!article) {
      throw { status: 404, code: "ARTICLE_NOT_FOUND", message: "Produit introuvable." };
    }
    return article;
  },

  async create(data: { reference: string; name: string; description?: string; barcode?: string; unit?: string; minimumStock?: number }) {
    const existing = await articleRepository.findByReference(data.reference);
    if (existing) {
      throw { status: 409, code: "REFERENCE_ALREADY_USED", message: "Cette référence existe déjà." };
    }

    return articleRepository.create({
      ...data,
      unit: data.unit ?? "unit",
      minimumStock: data.minimumStock ?? 0,
    });
  },

  async update(id: number, data: { reference?: string; name?: string; description?: string; barcode?: string; unit?: string; minimumStock?: number; active?: boolean }) {
    const article = await articleRepository.findById(id);
    if (!article) {
      throw { status: 404, code: "ARTICLE_NOT_FOUND", message: "Produit introuvable." };
    }

    if (data.reference && data.reference !== article.reference) {
      const existing = await articleRepository.findByReference(data.reference);
      if (existing) {
        throw { status: 409, code: "REFERENCE_ALREADY_USED", message: "Cette référence existe déjà." };
      }
    }

    return articleRepository.update(id, data);
  },

  async setActive(id: number, active: boolean) {
    const article = await articleRepository.findById(id);
    if (!article) {
      throw { status: 404, code: "ARTICLE_NOT_FOUND", message: "Produit introuvable." };
    }
    return articleRepository.setActive(id, active);
  },
};