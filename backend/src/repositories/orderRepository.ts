import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { orders, orderItems, articles, type NewOrder } from "../db/schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const orderRepository = {
  async findAll({ search, status, page = 1, limit = 20 }: { search?: string; status?: string; page?: number; limit?: number }) {
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(orders.reference, `%${search}%`),
          ilike(orders.customerName, `%${search}%`),
        ),
      );
    }
    if (status) conditions.push(eq(orders.status, status));
    const where = conditions.length ? and(...conditions) : undefined;

    const total = await db.$count(orders, where);
    const rows = await db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { rows, total };
  },

  async findById(id: number, tx?: Transaction) {
    const client = tx ?? db;
    const order = await client.query.orders.findFirst({ where: eq(orders.id, id) });
    if (!order) return null;
    const items = await client
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        articleId: orderItems.articleId,
        quantity: orderItems.quantity,
        reference: articles.reference,
        name: articles.name,
      })
      .from(orderItems)
      .leftJoin(articles, eq(articles.id, orderItems.articleId))
      .where(eq(orderItems.orderId, id));
    return { ...order, items };
  },

  async create(data: NewOrder, items: { articleId: number; quantity: number }[], tx?: Transaction) {
    const client = tx ?? db;
    const [created] = await client.insert(orders).values(data).returning();
    const lines = items.map((item) => ({ ...item, orderId: created.id }));
    const createdItems = await client.insert(orderItems).values(lines).returning();
    return { ...created, items: createdItems };
  },

  async updateStatus(id: number, status: string, tx?: Transaction) {
    const client = tx ?? db;
    const [updated] = await client
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  },
};
