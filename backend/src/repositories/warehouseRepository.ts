import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { warehouses, type NewWarehouse } from "../db/schema.js";

export const warehouseRepository = {
  async findAll({ search, page, limit }: { search?: string; page: number; limit: number }) {
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(warehouses.name, `%${search}%`),
          ilike(warehouses.address, `%${search}%`),
        ),
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const total = await db.$count(warehouses, where);

    const rows = await db
      .select()
      .from(warehouses)
      .where(where)
      .orderBy(desc(warehouses.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { rows, total };
  },

  async findById(id: number) {
    return db.query.warehouses.findFirst({ where: eq(warehouses.id, id) });
  },

  async create(data: NewWarehouse) {
    const [created] = await db.insert(warehouses).values(data).returning();
    return created;
  },

  async update(id: number, data: Partial<NewWarehouse>) {
    const [updated] = await db
      .update(warehouses)
      .set(data)
      .where(eq(warehouses.id, id))
      .returning();
    return updated;
  },

  async remove(id: number) {
    const [deleted] = await db
      .delete(warehouses)
      .where(eq(warehouses.id, id))
      .returning();
    return deleted;
  },
};