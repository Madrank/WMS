import { receiptRepository } from "../repositories/receiptRepository.js";
import { articleRepository } from "../repositories/articleRepository.js";
import { supplierRepository } from "../repositories/supplierRepository.js";
import { locationRepository } from "../repositories/locationRepository.js";
import { stockMovementRepository } from "../repositories/stockMovementRepository.js";
import { stockRepository } from "../repositories/stockRepository.js";
import { db } from "../db/index.js";

export const receiptService = {
  async list({ search, status, page = 1, limit = 20 }: { search?: string; status?: string; page?: number; limit?: number }) {
    const { rows, total } = await receiptRepository.findAll({ search, status, page, limit });
    return {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: number) {
    const receipt = await receiptRepository.findById(id);
    if (!receipt) {
      throw { status: 404, code: "RECEIPT_NOT_FOUND", message: "Réception introuvable." };
    }

    const items = await receiptRepository.findItemsByReceiptId(id);
    return { ...receipt, items };
  },

  async create(data: {
    reference: string;
    supplierId: number;
    createdBy: number;
    items: { articleId: number; expectedQuantity: number; receivedQuantity?: number; locationId: number }[];
  }) {
    if (!data.items || data.items.length === 0) {
      throw { status: 400, code: "EMPTY_RECEIPT", message: "Une réception doit contenir au moins un article." };
    }

    const existing = await receiptRepository.findByReference(data.reference);
    if (existing) {
      throw { status: 409, code: "REFERENCE_ALREADY_USED", message: "Cette référence existe déjà." };
    }

    const supplier = await supplierRepository.findById(data.supplierId);
    if (!supplier) {
      throw { status: 404, code: "SUPPLIER_NOT_FOUND", message: "Fournisseur introuvable." };
    }

    return db.transaction(async (tx) => {
      const receipt = await receiptRepository.create({
        reference: data.reference,
        supplierId: data.supplierId,
        status: "DRAFT",
        createdBy: data.createdBy,
      }, tx);

      const items = await receiptRepository.createItems(
        data.items.map((item) => ({
          receiptId: receipt.id,
          articleId: item.articleId,
          expectedQuantity: item.expectedQuantity,
          receivedQuantity: item.receivedQuantity ?? 0,
          locationId: item.locationId,
        })),
        tx,
      );

      return { ...receipt, items };
    });
  },

  async validate(id: number, userId: number) {
    return db.transaction(async (tx) => {
      const receipt = await receiptRepository.findById(id);
      if (!receipt) {
        throw { status: 404, code: "RECEIPT_NOT_FOUND", message: "Réception introuvable." };
      }
      if (receipt.status !== "DRAFT") {
        throw { status: 409, code: "RECEIPT_ALREADY_VALIDATED", message: "Cette réception a déjà été traitée." };
      }

      const items = await receiptRepository.findItemsByReceiptId(id);
      if (items.length === 0) {
        throw { status: 400, code: "EMPTY_RECEIPT", message: "Impossible de valider une réception sans articles." };
      }

      const updated = await receiptRepository.setStatus(id, "VALIDATED", userId, tx);

      for (const item of items) {
        if (item.receivedQuantity <= 0) {
          throw { status: 400, code: "QUANTITY_MUST_BE_POSITIVE", message: "La quantité reçue doit être positive." };
        }

        await stockMovementRepository.create({
          type: "IN",
          articleId: item.articleId,
          quantity: item.receivedQuantity,
          destinationLocationId: item.locationId,
          sourceLocationId: null,
          userId,
          reason: `Réception ${receipt.reference}`,
        }, tx);

        await stockRepository.increment(item.articleId, item.locationId, item.receivedQuantity, tx);
      }

      return { ...updated, items };
    });
  },
};