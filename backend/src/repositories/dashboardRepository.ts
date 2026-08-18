import { count, eq, ilike, lt, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { articles, suppliers, locations, stocks, stockMovements, zones } from "../db/schema.js";

export const dashboardRepository = {
  async getStats() {
    const [articleCount] = await db.select({ value: count() }).from(articles).where(eq(articles.active, true));
    const [supplierCount] = await db.select({ value: count() }).from(suppliers).where(eq(suppliers.active, true));
    const [locationCount] = await db.select({ value: count() }).from(locations);
    const [stockTotal] = await db.select({ value: sql`COALESCE(SUM(${stocks.quantity}), 0)` }).from(stocks);

    return {
      activeArticles: Number(articleCount?.value ?? 0),
      activeSuppliers: Number(supplierCount?.value ?? 0),
      locations: Number(locationCount?.value ?? 0),
      totalStockUnits: Number(stockTotal?.value ?? 0),
    };
  },

  async getLowStock() {
    return db
      .select({
        id: articles.id,
        reference: articles.reference,
        name: articles.name,
        minimumStock: articles.minimumStock,
        totalQuantity: sql<number>`COALESCE(SUM(${stocks.quantity}), 0)`,
      })
      .from(articles)
      .leftJoin(stocks, eq(stocks.articleId, articles.id))
      .where(eq(articles.active, true))
      .groupBy(articles.id)
      .having(sql`COALESCE(SUM(${stocks.quantity}), 0) < ${articles.minimumStock}`);
  },

  async getRecentMovements(limit = 10) {
    return db
      .select({
        id: stockMovements.id,
        type: stockMovements.type,
        quantity: stockMovements.quantity,
        reason: stockMovements.reason,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .orderBy(sql`${stockMovements.createdAt} DESC`)
      .limit(limit);
  },

  async getStockByLocation() {
    return db
      .select({
        locationId: stocks.locationId,
        locationCode: locations.code,
        zoneName: zones.name,
        totalQuantity: sql<number>`COALESCE(SUM(${stocks.quantity}), 0)`,
      })
      .from(stocks)
      .innerJoin(locations, eq(locations.id, stocks.locationId))
      .innerJoin(zones, eq(zones.id, locations.zoneId))
      .groupBy(stocks.locationId, locations.code, zones.name)
      .orderBy(sql`COALESCE(SUM(${stocks.quantity}), 0) DESC`);
  },
};