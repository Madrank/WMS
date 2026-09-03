import { auditLogRepository } from "../repositories/auditLogRepository.js";

export const auditService = {
  async log(data: { userId: number; action: string; entityType: string; entityId?: number; description: string }) {
    return auditLogRepository.create({
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      description: data.description,
    });
  },

  async list({ userId, action, search, page = 1, limit = 20 }: { userId?: number; action?: string; search?: string; page?: number; limit?: number }) {
    const { rows, total } = await auditLogRepository.findAll({
      userId,
      action,
      search,
      page,
      limit,
    });
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
};
