import { zoneRepository } from "../repositories/zoneRepository.js";

export const zoneService = {
  async list({ warehouseId, page = 1, limit = 20 }: { warehouseId?: number; page?: number; limit?: number }) {
    const { rows, total } = await zoneRepository.findAll({ warehouseId, page, limit });
    return {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: number) {
    const zone = await zoneRepository.findById(id);
    if (!zone) {
      throw { status: 404, code: "ZONE_NOT_FOUND", message: "Zone introuvable." };
    }
    return zone;
  },

  async create(data: { name: string; code: string; warehouseId: number }) {
    const existing = await zoneRepository.findByWarehouseAndCode(data.warehouseId, data.code);
    if (existing) {
      throw { status: 409, code: "ZONE_CODE_ALREADY_USED", message: "Une zone avec ce code existe déjà dans cet entrepôt." };
    }
    return zoneRepository.create(data);
  },

  async update(id: number, data: { name?: string; code?: string; warehouseId?: number }) {
    const zone = await this.getById(id);

    const warehouseId = data.warehouseId ?? zone.warehouseId;
    const code = data.code ?? zone.code;

    if (data.code || data.warehouseId) {
      const existing = await zoneRepository.findByWarehouseAndCode(warehouseId, code);
      if (existing && existing.id !== id) {
        throw { status: 409, code: "ZONE_CODE_ALREADY_USED", message: "Une zone avec ce code existe déjà dans cet entrepôt." };
      }
    }

    return zoneRepository.update(id, data);
  },

  async remove(id: number) {
    await this.getById(id);
    return zoneRepository.remove(id);
  },
};