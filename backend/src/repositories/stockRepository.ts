import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { stocks, type NewStock } from "../db/schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const stockRepository = {
  async findAll({ articleId, locationId, page = 1, limit = 20 }: { articleId?: number; locationId?: number; page?: number; limit?: number }) {
    const conditions = [];
    if (articleId) conditions.push(eq(stocks.articleId, articleId));
    if (locationId) conditions.push(eq(stocks.locationId, locationId));
    const where = conditions.length ? and(...conditions) : undefined;

    const total = await db.$count(stocks, where);
    const rows = await db
      .select()
      .from(stocks)
      .where(where)
      .orderBy(asc(stocks.articleId), asc(stocks.locationId))
      .limit(limit)
      .offset((page - 1) * limit);

    return { rows, total };
  },

  async findById(id: number) {
    return db.query.stocks.findFirst({ where: eq(stocks.id, id) });
  },

  async findByArticleAndLocation(articleId: number, locationId: number) {
    return db.query.stocks.findFirst({
      where: and(eq(stocks.articleId, articleId), eq(stocks.locationId, locationId)),
    });
  },

  async increment(articleId: number, locationId: number, quantity: number, tx?: Transaction) {
    const client = tx ?? db;
    const existing = await client.query.stocks.findFirst({
      where: and(eq(stocks.articleId, articleId), eq(stocks.locationId, locationId)),
    });

    if (existing) {
      const [updated] = await client
        .update(stocks)
        .set({ quantity: sql`${stocks.quantity} + ${quantity}` })
        .where(and(eq(stocks.articleId, articleId), eq(stocks.locationId, locationId)))
        .returning();
      return updated;
    }

    const [created] = await client
      .insert(stocks)
      .values({ articleId, locationId, quantity })
      .returning();
    return created;
  },

  async decrement(articleId: number, locationId: number, quantity: number, tx?: Transaction) {
    const client = tx ?? db;
    const [updated] = await client
      .update(stocks)
      .set({ quantity: sql`${stocks.quantity} - ${quantity}` })
      .where(and(eq(stocks.articleId, articleId), eq(stocks.locationId, locationId)))
      .returning();
    return updated;
  },
};