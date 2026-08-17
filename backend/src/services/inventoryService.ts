import { inventoryRepository } from "../repositories/inventoryRepository.js";
import { locationRepository } from "../repositories/locationRepository.js";
import { stockRepository } from "../repositories/stockRepository.js";
import { stockMovementRepository } from "../repositories/stockMovementRepository.js";
import { db } from "../db/index.js";

export const inventoryService = {
  async list({ search, status, page = 1, limit = 20 }: { search?: string; status?: string; page?: number; limit?: number }) {
    const { rows, total } = await inventoryRepository.findAll({ search, status, page, limit });
    return {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: number) {
    const inventory = await inventoryRepository.findById(id);
    if (!inventory) {
      throw { status: 404, code: "INVENTORY_NOT_FOUND", message: "Inventaire introuvable." };
    }

    const items = await inventoryRepository.findItemsByInventoryId(id);
    return { ...inventory, items };
  },

  async create(data: {
    reference: string;
    locationId: number;
    createdBy: number;
    items: { articleId: number; theoreticalQuantity: number; countedQuantity: number }[];
  }) {
    if (!data.items || data.items.length === 0) {
      throw { status: 400, code: "EMPTY_INVENTORY", message: "Un inventaire doit contenir au moins un article." };
    }

    const existing = await inventoryRepository.findByReference(data.reference);
    if (existing) {
      throw { status: 409, code: "REFERENCE_ALREADY_USED", message: "Cette référence existe déjà." };
    }

    const location = await locationRepository.findById(data.locationId);
    if (!location) {
      throw { status: 404, code: "LOCATION_NOT_FOUND", message: "Emplacement introuvable." };
    }

    return db.transaction(async (tx) => {
      const inventory = await inventoryRepository.create({
        reference: data.reference,
        locationId: data.locationId,
        status: "DRAFT",
        createdBy: data.createdBy,
      }, tx);

      const items = await inventoryRepository.createItems(
        data.items.map((item) => ({
          inventoryId: inventory.id,
          articleId: item.articleId,
          theoreticalQuantity: item.theoreticalQuantity,
          countedQuantity: item.countedQuantity,
        })),
        tx,
      );

      return { ...inventory, items };
    });
  },

  async validate(id: number, userId: number) {
    return db.transaction(async (tx) => {
      const inventory = await inventoryRepository.findById(id);
      if (!inventory) {
        throw { status: 404, code: "INVENTORY_NOT_FOUND", message: "Inventaire introuvable." };
      }
      if (inventory.status !== "DRAFT") {
        throw { status: 409, code: "INVENTORY_ALREADY_VALIDATED", message: "Cet inventaire a déjà été traité." };
      }

      const items = await inventoryRepository.findItemsByInventoryId(id);
      if (items.length === 0) {
        throw { status: 400, code: "EMPTY_INVENTORY", message: "Impossible de valider un inventaire sans articles." };
      }

      const updated = await inventoryRepository.setStatus(id, "VALIDATED", userId, tx);

      for (const item of items) {
        const difference = item.countedQuantity - item.theoreticalQuantity;
        if (difference === 0) {
          continue;
        }

        await stockMovementRepository.create({
          type: "ADJUSTMENT",
          articleId: item.articleId,
          quantity: Math.abs(difference),
          sourceLocationId: difference < 0 ? inventory.locationId : null,
          destinationLocationId: difference > 0 ? inventory.locationId : null,
          userId,
          reason: `Inventaire ${inventory.reference}`,
        }, tx);

        if (difference > 0) {
          await stockRepository.increment(item.articleId, inventory.locationId, difference, tx);
        } else {
          await stockRepository.decrement(item.articleId, inventory.locationId, Math.abs(difference), tx);
        }
      }

      return { ...updated, items };
    });
  },
};