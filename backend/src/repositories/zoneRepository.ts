import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { zones, type NewZone } from "../db/schema.js";

export const zoneRepository = {
  async findAll({ warehouseId, page, limit }: { warehouseId?: number; page: number; limit: number }) {
    const conditions = [];
    if (warehouseId) {
      conditions.push(eq(zones.warehouseId, warehouseId));
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const total = await db.$count(zones, where);

    const rows = await db
      .select()
      .from(zones)
      .where(where)
      .orderBy(desc(zones.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { rows, total };
  },

  async findById(id: number) {
    return db.query.zones.findFirst({ where: eq(zones.id, id) });
  },

  async findByWarehouseAndCode(warehouseId: number, code: string) {
    return db.query.zones.findFirst({
      where: and(eq(zones.warehouseId, warehouseId), eq(zones.code, code)),
    });
  },

  async create(data: NewZone) {
    const [created] = await db.insert(zones).values(data).returning();
    return created;
  },

  async update(id: number, data: Partial<NewZone>) {
    const [updated] = await db
      .update(zones)
      .set(data)
      .where(eq(zones.id, id))
      .returning();
    return updated;
  },

  async remove(id: number) {
    const [deleted] = await db
      .delete(zones)
      .where(eq(zones.id, id))
      .returning();
    return deleted;
  },
};