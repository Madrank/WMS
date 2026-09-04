import { db } from "../db/index.js";
import { orderRepository } from "../repositories/orderRepository.js";
import { stockRepository } from "../repositories/stockRepository.js";
import { stockMovementRepository } from "../repositories/stockMovementRepository.js";
import { articles, stocks } from "../db/schema.js";
import { asc, eq } from "drizzle-orm";

export const orderService = {
  async list({ search, status, page = 1, limit = 20 }: { search?: string; status?: string; page?: number; limit?: number }) {
    const { rows, total } = await orderRepository.findAll({ search, status, page, limit });
    return {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async detail(id: number) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw { status: 404, code: "ORDER_NOT_FOUND", message: "Commande introuvable." };
    }
    return order;
  },

  async create(data: { reference: string; customerName: string; userId: number; items: { articleId: number; quantity: number }[] }) {
    if (!data.reference) {
      throw { status: 400, code: "REFERENCE_REQUIRED", message: "La référence est obligatoire." };
    }
    if (!data.customerName) {
      throw { status: 400, code: "CUSTOMER_REQUIRED", message: "Le nom du client est obligatoire." };
    }
    if (!data.items || data.items.length === 0) {
      throw { status: 400, code: "ITEMS_REQUIRED", message: "La commande doit contenir au moins une ligne." };
    }
    for (const item of data.items) {
      if (!item.quantity || item.quantity <= 0) {
        throw { status: 400, code: "QUANTITY_MUST_BE_POSITIVE", message: "Les quantités doivent être strictement positives." };
      }
    }

    return db.transaction(async (tx) => {
      const order = await orderRepository.create(
        {
          reference: data.reference,
          customerName: data.customerName,
          status: "PENDING",
          createdBy: data.userId,
        },
        data.items.map((item) => ({ articleId: item.articleId, quantity: item.quantity })),
        tx,
      );
      return order;
    });
  },

  async validate(id: number, userId: number) {
    return db.transaction(async (tx) => {
      const order = await orderRepository.findById(id);
      if (!order) {
        throw { status: 404, code: "ORDER_NOT_FOUND", message: "Commande introuvable." };
      }
      if (order.status !== "PENDING") {
        throw { status: 409, code: "INVALID_STATUS", message: "Seules les commandes en attente peuvent être validées." };
      }

      for (const item of order.items) {
        const available = await stockRepository.sumByArticle(item.articleId, tx);
        if (available < item.quantity) {
          const article = await db.query.articles.findFirst({ where: eq(articles.id, item.articleId) });
          throw {
            status: 409,
            code: "INSUFFICIENT_STOCK",
            message: `Stock insuffisant pour l'article « ${article?.name ?? item.articleId} » (${available} disponible, ${item.quantity} requis).`,
          };
        }
      }

      await orderRepository.updateStatus(id, "VALIDATED", tx);
      const updated = await orderRepository.findById(id, tx);
      if (!updated) {
        throw { status: 404, code: "ORDER_NOT_FOUND", message: "Commande introuvable." };
      }
      return updated;
    });
  },

  async ship(id: number, userId: number) {
    return db.transaction(async (tx) => {
      const order = await orderRepository.findById(id);
      if (!order) {
        throw { status: 404, code: "ORDER_NOT_FOUND", message: "Commande introuvable." };
      }
      if (order.status !== "VALIDATED") {
        throw { status: 409, code: "INVALID_STATUS", message: "La commande doit être validée avant expédition." };
      }

      for (const item of order.items) {
        await this.destockArticle(item.articleId, item.quantity, userId, order.reference, tx);
      }

      await orderRepository.updateStatus(id, "SHIPPED", tx);
      const updated = await orderRepository.findById(id, tx);
      if (!updated) {
        throw { status: 404, code: "ORDER_NOT_FOUND", message: "Commande introuvable." };
      }
      return updated;
    });
  },

  async cancel(id: number, userId: number) {
    return db.transaction(async (tx) => {
      const order = await orderRepository.findById(id);
      if (!order) {
        throw { status: 404, code: "ORDER_NOT_FOUND", message: "Commande introuvable." };
      }
      if (order.status === "SHIPPED") {
        throw { status: 409, code: "INVALID_STATUS", message: "Une commande expédiée ne peut plus être annulée." };
      }
      if (order.status === "CANCELLED") {
        throw { status: 409, code: "INVALID_STATUS", message: "La commande est déjà annulée." };
      }
      await orderRepository.updateStatus(id, "CANCELLED", tx);
      const updated = await orderRepository.findById(id, tx);
      if (!updated) {
        throw { status: 404, code: "ORDER_NOT_FOUND", message: "Commande introuvable." };
      }
      return updated;
    });
  },

  async destockArticle(articleId: number, quantity: number, userId: number, reference: string, tx: any) {
    let remaining = quantity;
    const locationStocks = await tx
      .select({ locationId: stocks.locationId, quantity: stocks.quantity })
      .from(stocks)
      .where(eq(stocks.articleId, articleId))
      .orderBy(asc(stocks.id));

    if (!locationStocks.length) {
      throw { status: 409, code: "INSUFFICIENT_STOCK", message: "Aucun stock disponible pour l'article demandé." };
    }

    for (const loc of locationStocks) {
      if (remaining <= 0) break;
      const take = Math.min(loc.quantity, remaining);
      if (take <= 0) continue;
      await stockRepository.decrement(articleId, loc.locationId, take, tx);
      await stockMovementRepository.create(
        {
          type: "OUT",
          articleId,
          quantity: take,
          sourceLocationId: loc.locationId,
          destinationLocationId: null,
          userId,
          reason: `Expédition commande ${reference}`,
        },
        tx,
      );
      remaining -= take;
    }

    if (remaining > 0) {
      throw { status: 409, code: "INSUFFICIENT_STOCK", message: "Stock insuffisant pour satisfaire la commande." };
    }
  },
};
