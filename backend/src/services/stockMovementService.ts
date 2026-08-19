import { stockMovementRepository } from "../repositories/stockMovementRepository.js";
import { stockRepository } from "../repositories/stockRepository.js";
import { articleRepository } from "../repositories/articleRepository.js";
import { locationRepository } from "../repositories/locationRepository.js";
import { db } from "../db/index.js";

export const stockMovementService = {
  async list({ articleId, locationId, type, userId, from, to, page = 1, limit = 20 }: { articleId?: number; locationId?: number; type?: string; userId?: number; from?: Date; to?: Date; page?: number; limit?: number }) {
    const { rows, total } = await stockMovementRepository.findAll({ articleId, locationId, type, userId, from, to, page, limit });
    return {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async create(data: {
    type: string;
    articleId: number;
    quantity: number;
    sourceLocationId?: number | null;
    destinationLocationId?: number | null;
    userId: number;
    reason?: string | null;
  }) {
    if (!data.quantity || data.quantity <= 0) {
      throw { status: 400, code: "QUANTITY_MUST_BE_POSITIVE", message: "La quantité doit être strictement positive." };
    }

    return db.transaction(async (tx) => {
      const article = await articleRepository.findById(data.articleId);
      if (!article) {
        throw { status: 404, code: "ARTICLE_NOT_FOUND", message: "Article introuvable." };
      }
      if (!article.active) {
        throw { status: 409, code: "ARTICLE_INACTIVE", message: "Ce produit est désactivé." };
      }

      if (data.type === "IN") {
        if (!data.destinationLocationId) {
          throw { status: 400, code: "INVALID_MOVEMENT", message: "Une entrée nécessite un emplacement de destination." };
        }
        const location = await locationRepository.findById(data.destinationLocationId);
        if (!location) {
          throw { status: 404, code: "LOCATION_NOT_FOUND", message: "Emplacement introuvable." };
        }
        if (!location.active) {
          throw { status: 409, code: "LOCATION_INACTIVE", message: "Cet emplacement est désactivé." };
        }
      }

      if (data.type === "OUT") {
        if (!data.sourceLocationId) {
          throw { status: 400, code: "INVALID_MOVEMENT", message: "Une sortie nécessite un emplacement source." };
        }
        const location = await locationRepository.findById(data.sourceLocationId);
        if (!location) {
          throw { status: 404, code: "LOCATION_NOT_FOUND", message: "Emplacement introuvable." };
        }
        if (!location.active) {
          throw { status: 409, code: "LOCATION_INACTIVE", message: "Cet emplacement est désactivé." };
        }
        const existing = await stockRepository.findByArticleAndLocation(data.articleId, data.sourceLocationId);
        if (!existing || existing.quantity < data.quantity) {
          throw { status: 409, code: "INSUFFICIENT_STOCK", message: "Stock insuffisant dans cet emplacement." };
        }
      }

      if (data.type === "TRANSFER") {
        if (!data.sourceLocationId || !data.destinationLocationId) {
          throw { status: 400, code: "INVALID_MOVEMENT", message: "Un transfert nécessite un emplacement source et un emplacement de destination." };
        }
        if (data.sourceLocationId === data.destinationLocationId) {
          throw { status: 400, code: "INVALID_MOVEMENT", message: "Les emplacements source et destination doivent être différents." };
        }
        const source = await locationRepository.findById(data.sourceLocationId);
        if (!source) {
          throw { status: 404, code: "LOCATION_NOT_FOUND", message: "Emplacement source introuvable." };
        }
        if (!source.active) {
          throw { status: 409, code: "LOCATION_INACTIVE", message: "Cet emplacement est désactivé." };
        }
        const destination = await locationRepository.findById(data.destinationLocationId);
        if (!destination) {
          throw { status: 404, code: "LOCATION_NOT_FOUND", message: "Emplacement de destination introuvable." };
        }
        if (!destination.active) {
          throw { status: 409, code: "LOCATION_INACTIVE", message: "Cet emplacement est désactivé." };
        }
        const existing = await stockRepository.findByArticleAndLocation(data.articleId, data.sourceLocationId);
        if (!existing || existing.quantity < data.quantity) {
          throw { status: 409, code: "INSUFFICIENT_STOCK", message: "Stock insuffisant dans l'emplacement source." };
        }
      }

      const movement = await stockMovementRepository.create(data, tx);

      if (data.type === "IN") {
        await stockRepository.increment(data.articleId, data.destinationLocationId!, data.quantity, tx);
      } else if (data.type === "OUT") {
        await stockRepository.decrement(data.articleId, data.sourceLocationId!, data.quantity, tx);
      } else if (data.type === "TRANSFER") {
        await stockRepository.decrement(data.articleId, data.sourceLocationId!, data.quantity, tx);
        await stockRepository.increment(data.articleId, data.destinationLocationId!, data.quantity, tx);
      }

      return movement;
    });
  },
};