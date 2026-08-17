import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { locations, type NewLocation } from "../db/schema.js";

export const locationRepository = {
  async findAll({ zoneId, active, page, limit }: { zoneId?: number; active?: boolean; page: number; limit: number }) {
    const conditions = [];
    if (zoneId) {
      conditions.push(eq(locations.zoneId, zoneId));
    }
    if (active !== undefined) {
      conditions.push(eq(locations.active, active));
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const total = await db.$count(locations, where);

    const rows = await db
      .select()
      .from(locations)
      .where(where)
      .orderBy(desc(locations.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { rows, total };
  },

  async findById(id: number) {
    return db.query.locations.findFirst({ where: eq(locations.id, id) });
  },

  async findByCode(code: string) {
    return db.query.locations.findFirst({ where: eq(locations.code, code) });
  },

  async create(data: NewLocation) {
    const [created] = await db.insert(locations).values(data).returning();
    return created;
  },

  async update(id: number, data: Partial<NewLocation>) {
    const [updated] = await db
      .update(locations)
      .set(data)
      .where(eq(locations.id, id))
      .returning();
    return updated;
  },

  async setActive(id: number, active: boolean) {
    const [updated] = await db
      .update(locations)
      .set({ active })
      .where(eq(locations.id, id))
      .returning();
    return updated;
  },
};