import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, type NewUser } from "../db/schema.js";

export const userRepository = {
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
};