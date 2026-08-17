import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { inventories, inventoryItems, type NewInventory, type NewInventoryItem } from "../db/schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const inventoryRepository = {
  async findAll({ search, status, page = 1, limit = 20 }: { search?: string; status?: string; page?: number; limit?: number }) {
    const conditions = [];
    if (search) {
      conditions.push(ilike(inventories.reference, `%${search}%`));
    }
    if (status) {
      conditions.push(eq(inventories.status, status));
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const total = await db.$count(inventories, where);
    const rows = await db
      .select()
      .from(inventories)
      .where(where)
      .orderBy(desc(inventories.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { rows, total };
  },

  async findById(id: number) {
    return db.query.inventories.findFirst({ where: eq(inventories.id, id) });
  },

  async findByReference(reference: string) {
    return db.query.inventories.findFirst({ where: eq(inventories.reference, reference) });
  },

  async findItemsByInventoryId(inventoryId: number) {
    return db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.inventoryId, inventoryId))
      .orderBy(asc(inventoryItems.id));
  },

  async create(data: NewInventory, tx?: Transaction) {
    const client = tx ?? db;
    const [created] = await client.insert(inventories).values(data).returning();
    return created;
  },

  async createItems(items: NewInventoryItem[], tx?: Transaction) {
    const client = tx ?? db;
    return client.insert(inventoryItems).values(items).returning();
  },

  async setStatus(id: number, status: string, validatedBy?: number, tx?: Transaction) {
    const client = tx ?? db;
    const [updated] = await client
      .update(inventories)
      .set({
        status,
        validatedBy: validatedBy ?? undefined,
        validatedAt: status === "VALIDATED" ? new Date() : undefined,
      })
      .where(eq(inventories.id, id))
      .returning();
    return updated;
  },
};