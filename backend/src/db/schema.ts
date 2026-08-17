import { pgTable, serial, varchar, text, integer, boolean, timestamp, uniqueIndex, check, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";


const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

// Block users
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).notNull().default("OPERATOR"),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    check("users_role_check", sql`${table.role} IN ('ADMIN', 'MANAGER', 'OPERATOR')`),
  ],
);

// Block suppliers
export const suppliers = pgTable(
  "suppliers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    address: varchar("address", { length: 255 }),
    city: varchar("city", { length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }),
    country: varchar("country", { length: 100 }),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("suppliers_email_idx").on(table.email)],
);

// Block articles
export const articles = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 50 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    barcode: varchar("barcode", { length: 100 }),
    unit: varchar("unit", { length: 20 }).notNull().default("unit"),
    minimumStock: integer("minimum_stock").notNull().default(0),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("articles_reference_idx").on(table.reference),
    uniqueIndex("articles_barcode_idx").on(table.barcode),
  ],
);

// Block article_suppliers (many-to-many relationship between articles and suppliers)
export const articleSuppliers = pgTable(
  "article_suppliers",
  {
    articleId: serial("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    supplierId: serial("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.articleId, table.supplierId] })],
);

// Block warehouses (entrepots)
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }),
  ...timestamps,
});

// Bloc zones (zones) associees aux entrepots (warehouses)
export const zones = pgTable(
  "zones",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 20 }).notNull(),
    warehouseId: integer("warehouse_id")
      .notNull()
      .references(() => warehouses.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [uniqueIndex("zones_warehouse_code_idx").on(table.warehouseId, table.code)],
);

// Block locations (emplacements)
export const locations = pgTable(
  "locations",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    capacity: integer("capacity").notNull().default(1000),
    zoneId: integer("zone_id")
      .notNull()
      .references(() => zones.id, { onDelete: "cascade" }),
    active: boolean("active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("locations_code_idx").on(table.code),
  ],
);

// Block stocks (quantités d'articles dans les emplacements)
export const stocks = pgTable(
  "stocks",
  {
    id: serial("id").primaryKey(),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    locationId: integer("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("stocks_article_location_idx").on(table.articleId, table.locationId),
    check("stocks_quantity_check", sql`${table.quantity} >= 0`),
  ],
); 

// Block stock_movements (mouvements de stock)
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: serial("id").primaryKey(),
    type: varchar("type", { length: 20 }).notNull(),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    sourceLocationId: integer("source_location_id").references(() => locations.id, {
      onDelete: "restrict",
    }),
    destinationLocationId: integer("destination_location_id").references(
      () => locations.id,
      { onDelete: "restrict" },
    ),
    userId: integer("user_id").references(() => users.id, { onDelete: "restrict" }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "stock_movements_quantity_check",
      sql`${table.quantity} > 0`,
    ),
    check(
      "stock_movements_type_check",
      sql`${table.type} IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')`,
    ),
  ],
);

// Block receipts (réceptions de marchandises)
export const receipts = pgTable(
  "receipts",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 50 }).notNull(),
    supplierId: integer("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 20 }).notNull().default("DRAFT"),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    validatedBy: integer("validated_by").references(() => users.id, { onDelete: "restrict" }),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("receipts_reference_idx").on(table.reference),
    check(
      "receipts_status_check",
      sql`${table.status} IN ('DRAFT', 'VALIDATED', 'CANCELLED')`,
    ),
  ],
);

// Block receipt_items (articles reçus dans une réception)
export const receiptItems = pgTable(
  "receipt_items",
  {
    id: serial("id").primaryKey(),
    receiptId: integer("receipt_id")
      .notNull()
      .references(() => receipts.id, { onDelete: "cascade" }),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "restrict" }),
    expectedQuantity: integer("expected_quantity").notNull(),
    receivedQuantity: integer("received_quantity").notNull().default(0),
    locationId: integer("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
  },
  (table) => [
    check(
      "receipt_items_expected_positive_check",
      sql`${table.expectedQuantity} > 0`,
    ),
    check(
      "receipt_items_received_positive_check",
      sql`${table.receivedQuantity} >= 0`,
    ),
  ],
);

// Block inventories (inventaires)
export const inventories = pgTable(
  "inventories",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 50 }).notNull(),
    locationId: integer("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 20 }).notNull().default("DRAFT"),
    createdBy: integer("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    validatedBy: integer("validated_by").references(() => users.id, { onDelete: "restrict" }),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("inventories_reference_idx").on(table.reference),
    check(
      "inventories_status_check",
      sql`${table.status} IN ('DRAFT', 'VALIDATED')`,
    ),
  ],
);

// Block inventory_items (articles inventoriés dans un inventaire)
export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: serial("id").primaryKey(),
    inventoryId: integer("inventory_id")
      .notNull()
      .references(() => inventories.id, { onDelete: "cascade" }),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "restrict" }),
    theoreticalQuantity: integer("theoretical_quantity").notNull().default(0),
    countedQuantity: integer("counted_quantity").notNull().default(0),
  },
  (table) => [
    check(
      "inventory_items_counted_positive_check",
      sql`${table.countedQuantity} >= 0`,
    ),
  ],
); 

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type Stock = typeof stocks.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type Receipt = typeof receipts.$inferSelect;
export type Inventory = typeof inventories.$inferSelect;
export type Warehouse = typeof warehouses.$inferSelect;
export type NewWarehouse = typeof warehouses.$inferInsert;
export type Zone = typeof zones.$inferSelect;
export type NewZone = typeof zones.$inferInsert;
export type NewLocation = typeof locations.$inferInsert;
export type NewStock = typeof stocks.$inferInsert;
export type NewStockMovement = typeof stockMovements.$inferInsert;
export type NewReceipt = typeof receipts.$inferInsert;
export type NewReceiptItem = typeof receiptItems.$inferInsert;