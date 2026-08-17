import { supplierRepository } from "../repositories/supplierRepository.js";

export const supplierService = {
  async list({ search, page = 1, limit = 20 }: { search?: string; page?: number; limit?: number }) {
    const { rows, total } = await supplierRepository.findAll({ search, page, limit });
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
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw { status: 404, code: "SUPPLIER_NOT_FOUND", message: "Fournisseur introuvable." };
    }
    return supplier;
  },

  async create(data: { name: string; email?: string; phone?: string; address?: string; city?: string; postalCode?: string; country?: string }) {
    if (data.email) {
      const existing = await supplierRepository.findByEmail(data.email);
      if (existing) {
        throw { status: 409, code: "EMAIL_ALREADY_USED", message: "Un fournisseur avec cet email existe déjà." };
      }
    }

    return supplierRepository.create(data);
  },

  async update(id: number, data: { name?: string; email?: string; phone?: string; address?: string; city?: string; postalCode?: string; country?: string; active?: boolean }) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw { status: 404, code: "SUPPLIER_NOT_FOUND", message: "Fournisseur introuvable." };
    }

    if (data.email && data.email !== supplier.email) {
      const existing = await supplierRepository.findByEmail(data.email);
      if (existing) {
        throw { status: 409, code: "EMAIL_ALREADY_USED", message: "Un fournisseur avec cet email existe déjà." };
      }
    }

    return supplierRepository.update(id, data);
  },

  async setActive(id: number, active: boolean) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) {
      throw { status: 404, code: "SUPPLIER_NOT_FOUND", message: "Fournisseur introuvable." };
    }
    return supplierRepository.setActive(id, active);
  },
};