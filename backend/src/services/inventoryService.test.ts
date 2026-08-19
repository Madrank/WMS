import { describe, it, expect, vi, beforeEach } from "vitest";
import { inventoryService } from "./inventoryService.js";
import { inventoryRepository } from "../repositories/inventoryRepository.js";
import { locationRepository } from "../repositories/locationRepository.js";
import { stockRepository } from "../repositories/stockRepository.js";
import { stockMovementRepository } from "../repositories/stockMovementRepository.js";
import { db } from "../db/index.js";

vi.mock("../db/index.js", () => ({
  db: { transaction: (fn: (tx: unknown) => unknown) => fn({}) },
}));

vi.mock("../repositories/inventoryRepository.js", () => ({
  inventoryRepository: {
    findByReference: vi.fn(),
    findById: vi.fn(),
    findItemsByInventoryId: vi.fn(),
    create: vi.fn(),
    createItems: vi.fn(),
    setStatus: vi.fn(),
  },
}));

vi.mock("../repositories/locationRepository.js", () => ({
  locationRepository: { findById: vi.fn() },
}));

vi.mock("../repositories/stockRepository.js", () => ({
  stockRepository: { increment: vi.fn(), decrement: vi.fn() },
}));

vi.mock("../repositories/stockMovementRepository.js", () => ({
  stockMovementRepository: { create: vi.fn(), findAll: vi.fn() },
}));

const draftInventory = {
  id: 1,
  reference: "INV-0001",
  locationId: 1,
  status: "DRAFT",
  createdBy: 1,
  validatedBy: null,
  validatedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const location = {
  id: 1,
  name: "A-01-01",
  code: "A-01-01",
  capacity: 1000,
  zoneId: 1,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("inventoryService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crée un inventaire DRAFT avec ses lignes", async () => {
    vi.mocked(inventoryRepository.findByReference).mockResolvedValue(undefined);
    vi.mocked(locationRepository.findById).mockResolvedValue(location);
    vi.mocked(inventoryRepository.create).mockResolvedValue(draftInventory);
    vi.mocked(inventoryRepository.createItems).mockResolvedValue([
      { id: 1, inventoryId: 1, articleId: 1, theoreticalQuantity: 120, countedQuantity: 118 },
    ]);

    const result = await inventoryService.create({
      reference: "INV-0001",
      locationId: 1,
      createdBy: 1,
      items: [{ articleId: 1, theoreticalQuantity: 120, countedQuantity: 118 }],
    });

    expect(result.status).toBe("DRAFT");
    expect(result.items).toHaveLength(1);
  });

  it("refuse un inventaire sans articles", async () => {
    await expect(
      inventoryService.create({ reference: "INV-0002", locationId: 1, createdBy: 1, items: [] }),
    ).rejects.toMatchObject({ status: 400, code: "EMPTY_INVENTORY" });
  });

  it("refuse une référence déjà utilisée", async () => {
    vi.mocked(inventoryRepository.findByReference).mockResolvedValue(draftInventory);

    await expect(
      inventoryService.create({
        reference: "INV-0001",
        locationId: 1,
        createdBy: 1,
        items: [{ articleId: 1, theoreticalQuantity: 120, countedQuantity: 118 }],
      }),
    ).rejects.toMatchObject({ status: 409, code: "REFERENCE_ALREADY_USED" });
  });

  it("refuse un emplacement inexistant", async () => {
    vi.mocked(inventoryRepository.findByReference).mockResolvedValue(undefined);
    vi.mocked(locationRepository.findById).mockResolvedValue(undefined);

    await expect(
      inventoryService.create({
        reference: "INV-0003",
        locationId: 99,
        createdBy: 1,
        items: [{ articleId: 1, theoreticalQuantity: 120, countedQuantity: 118 }],
      }),
    ).rejects.toMatchObject({ status: 404, code: "LOCATION_NOT_FOUND" });
  });
});

describe("inventoryService.validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calcule les écarts et crée les mouvements d'ajustement", async () => {
    vi.mocked(inventoryRepository.findById).mockResolvedValue(draftInventory);
    vi.mocked(inventoryRepository.findItemsByInventoryId).mockResolvedValue([
      { id: 1, inventoryId: 1, articleId: 1, theoreticalQuantity: 120, countedQuantity: 118 }, // écart -2
      { id: 2, inventoryId: 1, articleId: 2, theoreticalQuantity: 45, countedQuantity: 45 },   // écart 0
      { id: 3, inventoryId: 1, articleId: 3, theoreticalQuantity: 12, countedQuantity: 14 },   // écart +2
    ]);
    vi.mocked(inventoryRepository.setStatus).mockResolvedValue({
      ...draftInventory,
      status: "VALIDATED",
      validatedBy: 9,
      validatedAt: new Date(),
    });

    const result = await inventoryService.validate(1, 9);

    expect(result.status).toBe("VALIDATED");
    // 2 mouvements seulement : l'écart 0 est ignoré
    expect(stockMovementRepository.create).toHaveBeenCalledTimes(2);

    // écart négatif → source = emplacement, décrément
    expect(stockMovementRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ADJUSTMENT",
        articleId: 1,
        quantity: 2,
        sourceLocationId: 1,
        destinationLocationId: null,
      }),
      {},
    );
    expect(stockRepository.decrement).toHaveBeenCalledWith(1, 1, 2, {});

    // écart positif → destination = emplacement, incrément
    expect(stockMovementRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "ADJUSTMENT",
        articleId: 3,
        quantity: 2,
        sourceLocationId: null,
        destinationLocationId: 1,
      }),
      {},
    );
    expect(stockRepository.increment).toHaveBeenCalledWith(3, 1, 2, {});

    // l'écart nul n'a généré aucun mouvement
    expect(stockRepository.decrement).not.toHaveBeenCalledWith(2, 1, expect.any(Number), {});
    expect(stockRepository.increment).not.toHaveBeenCalledWith(2, 1, expect.any(Number), {});
  });

  it("refuse de valider un inventaire déjà validé", async () => {
    vi.mocked(inventoryRepository.findById).mockResolvedValue({
      ...draftInventory,
      status: "VALIDATED",
    });

    await expect(inventoryService.validate(1, 9)).rejects.toMatchObject({
      status: 409,
      code: "INVENTORY_ALREADY_VALIDATED",
    });
  });

  it("refuse de valider un inventaire sans articles", async () => {
    vi.mocked(inventoryRepository.findById).mockResolvedValue(draftInventory);
    vi.mocked(inventoryRepository.findItemsByInventoryId).mockResolvedValue([]);

    await expect(inventoryService.validate(1, 9)).rejects.toMatchObject({
      status: 400,
      code: "EMPTY_INVENTORY",
    });
  });
});