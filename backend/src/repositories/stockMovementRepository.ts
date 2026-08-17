import { and, desc, eq, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { stockMovements, type NewStockMovement } from "../db/schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const stockMovementRepository = {
  async findAll({ articleId, locationId, type, page = 1, limit = 20 }: { articleId?: number; locationId?: number; type?: string; page?: number; limit?: number }) {
    const conditions = [];
    if (articleId) conditions.push(eq(stockMovements.articleId, articleId));
    if (type) conditions.push(eq(stockMovements.type, type));

    if (locationId) {
      conditions.push(
        or(
          eq(stockMovements.sourceLocationId, locationId),
          eq(stockMovements.destinationLocationId, locationId),
        ),
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const total = await db.$count(stockMovements, where);

    const rows = await db
      .select()
      .from(stockMovements)
      .where(where)
      .orderBy(desc(stockMovements.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { rows, total };
  },

    async create(data: NewStockMovement, tx?: Transaction) {
    const client = tx ?? db;
    const [created] = await client.insert(stockMovements).values(data).returning();
    return created;
  },
};