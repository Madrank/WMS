import { and, asc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { articles, locations, stocks, type NewStock } from "../db/schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const stockRepository = {
  async findAll({ articleId, locationId, zoneId, search, page = 1, limit = 20 }: { articleId?: number; locationId?: number; zoneId?: number; search?: string; page?: number; limit?: number }) {
    const conditions = [];
    if (articleId) conditions.push(eq(stocks.articleId, articleId));
    if (locationId) conditions.push(eq(stocks.locationId, locationId));
    if (search) {
      conditions.push(
        or(
          ilike(articles.reference, `%${search}%`),
          ilike(articles.name, `%${search}%`),
        ),
      );
    }
    if (zoneId) {
      const zoneLocations = await db
        .select({ id: locations.id })
        .from(locations)
        .where(eq(locations.zoneId, zoneId));
      conditions.push(inArray(stocks.locationId, zoneLocations.map((l) => l.id)));
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ value: sql<number>`count(*)` })
      .from(stocks)
      .leftJoin(articles, eq(articles.id, stocks.articleId))
      .where(where);

    const rows = await db
      .select()
      .from(stocks)
      .leftJoin(articles, eq(articles.id, stocks.articleId))
      .where(where)
      .orderBy(asc(stocks.articleId), asc(stocks.locationId))
      .limit(limit)
      .offset((page - 1) * limit);

    return { rows: rows.map((row) => row.stocks), total: Number(totalRow?.value ?? 0) };
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