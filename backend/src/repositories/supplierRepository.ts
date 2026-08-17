import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { suppliers, type NewSupplier } from "../db/schema.js";

export const supplierRepository = {
  async findAll({ search, page, limit }: { search?: string; page: number; limit: number }) {
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(suppliers.name, `%${search}%`),
          ilike(suppliers.email, `%${search}%`),
          ilike(suppliers.city, `%${search}%`),
        ),
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const total = await db.$count(suppliers, where);

    const rows = await db
      .select()
      .from(suppliers)
      .where(where)
      .orderBy(desc(suppliers.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { rows, total };
  },

  async findById(id: number) {
    return db.query.suppliers.findFirst({ where: eq(suppliers.id, id) });
  },

  async findByEmail(email: string) {
    return db.query.suppliers.findFirst({ where: eq(suppliers.email, email) });
  },

  async create(data: NewSupplier) {
    const [created] = await db.insert(suppliers).values(data).returning();
    return created;
  },

  async update(id: number, data: Partial<NewSupplier>) {
    const [updated] = await db
      .update(suppliers)
      .set(data)
      .where(eq(suppliers.id, id))
      .returning();
    return updated;
  },

  async setActive(id: number, active: boolean) {
    const [updated] = await db
      .update(suppliers)
      .set({ active })
      .where(eq(suppliers.id, id))
      .returning();
    return updated;
  },
};