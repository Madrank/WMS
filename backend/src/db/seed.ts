import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { articleSuppliers, articles, locations, stocks, suppliers, warehouses, zones } from "./schema.js";
import { db, pool } from "./index.js";
import { authService } from "../services/authService.js";
import { userRepository } from "../repositories/userRepository.js";

const demoUsers = [
  { firstName: "Alice", lastName: "Admin", email: "admin@wms.local", password: "admin123", role: "ADMIN" as const },
  { firstName: "Marc", lastName: "Manager", email: "manager@wms.local", password: "manager123", role: "MANAGER" as const },
  { firstName: "Oscar", lastName: "Opérateur", email: "operator@wms.local", password: "operator123", role: "OPERATOR" as const },
];

const demoSuppliers = [
  { name: "ACME Distribution", email: "contact@acme.com", phone: "+33 1 23 45 67 89", address: "12 rue des Usines", city: "Lyon", postalCode: "69000", country: "France" },
  { name: "Bureau Plus", email: "ventes@bureauplus.fr", phone: "+33 1 98 76 54 32", address: "8 avenue du Fournisseur", city: "Paris", postalCode: "75011", country: "France" },
  { name: "Logistique Nordique", email: "hello@lognord.io", phone: "+45 31 40 50 60", address: "Kystvejen 5", city: "Copenhague", postalCode: "2100", country: "Danemark" },
];

const demoArticles = [
  { reference: "SKU-001", name: "Clavier mécanique", unit: "unité", minimumStock: 10, barcode: "3700000000017" },
  { reference: "SKU-002", name: "Souris sans fil", unit: "unité", minimumStock: 15, barcode: "3700000000024" },
  { reference: "SKU-003", name: "Écran 24 pouces", unit: "unité", minimumStock: 5, barcode: "3700000000031" },
  { reference: "SKU-004", name: "Câble HDMI 2m", unit: "unité", minimumStock: 50, barcode: "3700000000048" },
  { reference: "SKU-005", name: "Casque audio USB", unit: "unité", minimumStock: 8, barcode: "3700000000055" },
  { reference: "SKU-006", name: "Webcam Full HD", unit: "unité", minimumStock: 6, barcode: "3700000000062" },
  { reference: "SKU-007", name: "Hub USB 4 ports", unit: "unité", minimumStock: 20, barcode: "3700000000079" },
  { reference: "SKU-008", name: "Support ordinateur portable", unit: "unité", minimumStock: 12, barcode: "3700000000086" },
  { reference: "SKU-009", name: "Papier A4 (ramette)", unit: "paquet", minimumStock: 100, barcode: "3700000000093" },
  { reference: "SKU-010", name: "Cartouche encre noire", unit: "unité", minimumStock: 30, barcode: "3700000000109" },
];

const links: Array<[number, number[]]> = [
  [0, [0, 1]],
  [1, [0]],
  [2, [1]],
  [3, [0, 2]],
  [4, [2]],
  [5, [0, 1, 2]],
  [6, [1]],
  [7, [0]],
  [8, [2]],
  [9, [1, 2]],
];

async function seedUsers() {
  for (const u of demoUsers) {
    if (await userRepository.findByEmail(u.email)) continue;
    await authService.createUser(u);
    console.log(`  user ${u.email}`);
  }
}

async function seedSuppliers() {
  const ids: number[] = [];
  for (const s of demoSuppliers) {
    const existing = await db.query.suppliers.findFirst({ where: eq(suppliers.name, s.name) });
    if (existing) { ids.push(existing.id); continue; }
    const [created] = await db.insert(suppliers).values(s).returning();
    if (!created) throw new Error(`Impossible de créer le fournisseur ${s.name}`);
    ids.push(created.id);
    console.log(`  supplier ${s.name}`);
  }
  return ids;
}

async function seedArticles() {
  const ids: number[] = [];
  for (const a of demoArticles) {
    const existing = await db.query.articles.findFirst({ where: eq(articles.reference, a.reference) });
    if (existing) { ids.push(existing.id); continue; }
    const [created] = await db.insert(articles).values(a).returning();
    if (!created) throw new Error(`Impossible de créer le produit ${a.reference}`);
    ids.push(created.id);
    console.log(`  article ${a.reference}`);
  }
  return ids;
}

async function seedLinks(articleIds: number[], supplierIds: number[]) {
  for (const [articleIdx, supplierIdxs] of links) {
    const articleId = articleIds[articleIdx];
    if (articleId === undefined) throw new Error("Lien invalide : produit inexistant.");
    await db.delete(articleSuppliers).where(eq(articleSuppliers.articleId, articleId));
    for (const supplierIdx of supplierIdxs) {
      const supplierId = supplierIds[supplierIdx];
      if (supplierId === undefined) throw new Error("Lien invalide : fournisseur inexistant.");
      await db.insert(articleSuppliers).values({ articleId, supplierId });
    }
  }
  console.log("  liens produit/fournisseur OK");
}

async function seedWarehouse() {
  const [wh] = await db.select().from(warehouses).limit(1);
  if (wh) return wh;
  const [created] = await db.insert(warehouses).values({ name: "Entrepôt principal", address: "5 rue de la Logistique, Lille" }).returning();
  if (!created) throw new Error("Impossible de créer l'entrepôt.");
  console.log("  entrepôt créé");
  return created;
}

const zoneTree = [
  { code: "A", name: "Zone A", locations: ["A-01-01", "A-01-02", "A-01-03"] },
  { code: "B", name: "Zone B", locations: ["B-01-01", "B-01-02"] },
  { code: "C", name: "Zone C", locations: ["C-01-01", "C-01-02"] },
];

async function seedZones(warehouseId: number) {
  const allZones = await db.select().from(zones);
  const byCode = new Map(allZones.map((z) => [z.code, z]));

  for (const z of zoneTree) {
    let zone = byCode.get(z.code);
    if (!zone) {
      const [created] = await db.insert(zones).values({ name: z.name, code: z.code, warehouseId }).returning();
      if (!created) throw new Error(`Impossible de créer la zone ${z.code}`);
      zone = created;
      console.log(`  zone ${z.code}`);
    }
    const allLocations = await db.select().from(locations);
    const locationByCode = new Map(allLocations.map((l) => [l.code, l]));
    for (const code of z.locations) {
      if (locationByCode.has(code)) continue;
      await db.insert(locations).values({ name: code, code, capacity: 1000, zoneId: zone.id });
      console.log(`  emplacement ${code}`);
    }
  }
}

const demoStocks: Array<{ reference: string; location: string; quantity: number }> = [
  { reference: "SKU-001", location: "A-01-01", quantity: 50 },
  { reference: "SKU-002", location: "B-01-01", quantity: 30 },
  { reference: "SKU-003", location: "A-01-01", quantity: 12 },
  { reference: "SKU-004", location: "C-01-01", quantity: 80 },
  { reference: "SKU-005", location: "B-01-02", quantity: 25 },
  { reference: "SKU-009", location: "C-01-01", quantity: 200 },
  { reference: "SKU-010", location: "A-01-02", quantity: 60 },
];

async function seedStocks() {
  for (const s of demoStocks) {
    const article = await db.query.articles.findFirst({ where: eq(articles.reference, s.reference) });
    if (!article) throw new Error(`Produit introuvable pour le stock ${s.reference}.`);
    const location = await db.query.locations.findFirst({ where: eq(locations.code, s.location) });
    if (!location) throw new Error(`Emplacement introuvable pour le stock ${s.location}.`);
    const existing = await db.query.stocks.findFirst({
      where: and(eq(stocks.articleId, article.id), eq(stocks.locationId, location.id)),
    });
    if (existing) continue;
    await db.insert(stocks).values({ articleId: article.id, locationId: location.id, quantity: s.quantity });
    console.log(`  stock ${s.reference} @ ${s.location} = ${s.quantity}`);
  }
}

async function seed() {
  console.log("Seed en cours...");
  await seedUsers();
  const supplierIds = await seedSuppliers();
  const articleIds = await seedArticles();
  await seedLinks(articleIds, supplierIds);
  const wh = await seedWarehouse();
  await seedZones(wh.id);
  await seedStocks();
  console.log("Seed terminé.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Erreur pendant le seed :", err);
  process.exit(1);
});