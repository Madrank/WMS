import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/userRepository.js";

const ALLOWED_ROLES = ["ADMIN", "MANAGER", "OPERATOR"];

export const userService = {
  async list({ search, active, page = 1, limit = 20 }: { search?: string; active?: boolean; page?: number; limit?: number }) {
    const { rows, total } = await userRepository.findAll({ search, active, page, limit });
    return {
      data: rows.map(publicUser),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: number) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw { status: 404, code: "USER_NOT_FOUND", message: "Utilisateur introuvable." };
    }
    return publicUser(user);
  },

  async create(data: { firstName: string; lastName: string; email: string; password: string; role: string }) {
    validateRole(data.role);

    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw { status: 409, code: "EMAIL_ALREADY_USED", message: "Un utilisateur avec cet email existe déjà." };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const created = await userRepository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      role: data.role,
    });
    return publicUser(created);
  },

  async update(id: number, data: { firstName?: string; lastName?: string; email?: string; password?: string; role?: string }) {
    if (data.role) validateRole(data.role);

    if (data.email) {
      const existing = await userRepository.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw { status: 409, code: "EMAIL_ALREADY_USED", message: "Un utilisateur avec cet email existe déjà." };
      }
    }

    const patch: Partial<{ firstName: string; lastName: string; email: string; passwordHash: string; role: string }> = {};
    if (data.firstName !== undefined) patch.firstName = data.firstName;
    if (data.lastName !== undefined) patch.lastName = data.lastName;
    if (data.email !== undefined) patch.email = data.email;
    if (data.role !== undefined) patch.role = data.role;
    if (data.password) patch.passwordHash = await bcrypt.hash(data.password, 10);

    const updated = await userRepository.update(id, patch);
    if (!updated) {
      throw { status: 404, code: "USER_NOT_FOUND", message: "Utilisateur introuvable." };
    }
    return publicUser(updated);
  },

  async setActive(id: number, active: boolean) {
    const updated = await userRepository.setActive(id, active);
    if (!updated) {
      throw { status: 404, code: "USER_NOT_FOUND", message: "Utilisateur introuvable." };
    }
    return publicUser(updated);
  },
};

function validateRole(role: string) {
  if (!ALLOWED_ROLES.includes(role)) {
    throw { status: 400, code: "INVALID_ROLE", message: "Le rôle doit être ADMIN, MANAGER ou OPERATOR." };
  }
}

function publicUser(user: { id: number; firstName: string; lastName: string; email: string; role: string; active: boolean; createdAt: Date; updatedAt: Date }) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}