import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { articles, type NewArticle } from "../db/schema.js";

export const articleRepository = {
  async findAll({
    search,
    active,
    barcode,
    page,
    limit,
  }: {
    search?: string;
    active?: boolean;
    barcode?: string;
    page: number;
    limit: number;
  }) {
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(articles.name, `%${search}%`),
          ilike(articles.reference, `%${search}%`),
        ),
      );
    }

    if (barcode) {
      conditions.push(ilike(articles.barcode, `%${barcode}%`));
    }

    if (active !== undefined) {
      conditions.push(eq(articles.active, active));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const total = await db.$count(articles, where);

    const rows = await db
      .select()
      .from(articles)
      .where(where)
      .orderBy(desc(articles.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { rows, total };
  },

  async findById(id: number) {
    return db.query.articles.findFirst({ where: eq(articles.id, id) });
  },

  async findByReference(reference: string) {
    return db.query.articles.findFirst({ where: eq(articles.reference, reference) });
  },

  async create(data: NewArticle) {
    const [created] = await db.insert(articles).values(data).returning();
    return created;
  },

  async update(id: number, data: Partial<NewArticle>) {
    const [updated] = await db
      .update(articles)
      .set(data)
      .where(eq(articles.id, id))
      .returning();
    return updated;
  },

  async setActive(id: number, active: boolean) {
    const [updated] = await db
      .update(articles)
      .set({ active })
      .where(eq(articles.id, id))
      .returning();
    return updated;
  },
};