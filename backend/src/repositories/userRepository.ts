import { and, asc, eq, ilike, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, type NewUser } from "../db/schema.js";

export const userRepository = {
  async findAll({ search, active, page = 1, limit = 20 }: { search?: string; active?: boolean; page?: number; limit?: number }) {
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
          ilike(users.email, `%${search}%`),
        ),
      );
    }
    if (active !== undefined) conditions.push(eq(users.active, active));
    const where = conditions.length ? and(...conditions) : undefined;

    const total = await db.$count(users, where);
    const rows = await db
      .select()
      .from(users)
      .where(where)
      .orderBy(asc(users.id))
      .limit(limit)
      .offset((page - 1) * limit);

    return { rows, total };
  },

  async findByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  },

  async findById(id: number) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  },

  async create(data: NewUser) {
    const [created] = await db.insert(users).values(data).returning();
    return created;
  },

  async update(id: number, data: Partial<NewUser>) {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  },

  async setActive(id: number, active: boolean) {
    const [updated] = await db.update(users).set({ active }).where(eq(users.id, id)).returning();
    return updated;
  },
};