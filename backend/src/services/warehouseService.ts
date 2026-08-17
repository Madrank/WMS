import { warehouseRepository } from "../repositories/warehouseRepository.js";

export const warehouseService = {
  async list({ search, page = 1, limit = 20 }: { search?: string; page?: number; limit?: number }) {
    const { rows, total } = await warehouseRepository.findAll({ search, page, limit });
    return {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: number) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) {
      throw { status: 404, code: "WAREHOUSE_NOT_FOUND", message: "Entrepôt introuvable." };
    }
    return warehouse;
  },

  async create(data: { name: string; address?: string }) {
    return warehouseRepository.create(data);
  },

  async update(id: number, data: { name?: string; address?: string }) {
    await this.getById(id);
    return warehouseRepository.update(id, data);
  },

  async remove(id: number) {
    await this.getById(id);
    return warehouseRepository.remove(id);
  },
};