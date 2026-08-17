import { locationRepository } from "../repositories/locationRepository.js";

export const locationService = {
  async list({ zoneId, active, page = 1, limit = 20 }: { zoneId?: number; active?: boolean; page?: number; limit?: number }) {
    const { rows, total } = await locationRepository.findAll({ zoneId, active, page, limit });
    return {
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: number) {
    const location = await locationRepository.findById(id);
    if (!location) {
      throw { status: 404, code: "LOCATION_NOT_FOUND", message: "Emplacement introuvable." };
    }
    return location;
  },

  async create(data: { name: string; code: string; capacity?: number; zoneId: number }) {
    const existing = await locationRepository.findByCode(data.code);
    if (existing) {
      throw { status: 409, code: "CODE_ALREADY_USED", message: "Un emplacement avec ce code existe déjà." };
    }
    return locationRepository.create(data);
  },

  async update(id: number, data: { name?: string; code?: string; capacity?: number; zoneId?: number }) {
    const location = await this.getById(id);

    if (data.code && data.code !== location.code) {
      const existing = await locationRepository.findByCode(data.code);
      if (existing) {
        throw { status: 409, code: "CODE_ALREADY_USED", message: "Un emplacement avec ce code existe déjà." };
      }
    }

    return locationRepository.update(id, data);
  },

  async setActive(id: number, active: boolean) {
    await this.getById(id);
    return locationRepository.setActive(id, active);
  },
};