import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { auditLogs, users, type NewAuditLog } from "../db/schema.js";

export const auditLogRepository = {
  async findAll({ userId, action, search, page = 1, limit = 20 }: { userId?: number; action?: string; search?: string; page?: number; limit?: number }) {
    const conditions = [];
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (action) conditions.push(eq(auditLogs.action, action));
    if (search) {
      conditions.push(
        or(
          ilike(auditLogs.description, `%${search}%`),
          ilike(auditLogs.entityType, `%${search}%`),
        ),
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const total = await db.$count(auditLogs, where);

    const rows = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        description: auditLogs.description,
        createdAt: auditLogs.createdAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.userId))
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { rows, total };
  },

  async create(data: NewAuditLog) {
    const [created] = await db.insert(auditLogs).values(data).returning();
    return created;
  },
};
