import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { receipts, receiptItems, type NewReceipt, type NewReceiptItem } from "../db/schema.js";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const receiptRepository = {
  async findAll({ search, status, page = 1, limit = 20 }: { search?: string; status?: string; page?: number; limit?: number }) {
    const conditions = [];
    if (search) {
      conditions.push(or(
        ilike(receipts.reference, `%${search}%`),
      ));
    }
    if (status) {
      conditions.push(eq(receipts.status, status));
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const total = await db.$count(receipts, where);
    const rows = await db
      .select()
      .from(receipts)
      .where(where)
      .orderBy(desc(receipts.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { rows, total };
  },

  async findById(id: number) {
    return db.query.receipts.findFirst({ where: eq(receipts.id, id) });
  },

  async findByReference(reference: string) {
    return db.query.receipts.findFirst({ where: eq(receipts.reference, reference) });
  },

  async findItemsByReceiptId(receiptId: number) {
    return db
      .select()
      .from(receiptItems)
      .where(eq(receiptItems.receiptId, receiptId))
      .orderBy(asc(receiptItems.id));
  },

  async create(data: NewReceipt, tx?: Transaction) {
    const client = tx ?? db;
    const [created] = await client.insert(receipts).values(data).returning();
    return created;
  },

  async createItems(items: NewReceiptItem[], tx?: Transaction) {
    const client = tx ?? db;
    return client.insert(receiptItems).values(items).returning();
  },

  async setStatus(id: number, status: string, validatedBy?: number, tx?: Transaction) {
    const client = tx ?? db;
    const [updated] = await client
      .update(receipts)
      .set({
        status,
        validatedBy: validatedBy ?? undefined,
        validatedAt: status === "VALIDATED" ? new Date() : undefined,
      })
      .where(eq(receipts.id, id))
      .returning();
    return updated;
  },
};