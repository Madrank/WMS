import { describe, it, expect, vi, beforeEach } from "vitest";
import { stockMovementService } from "./stockMovementService.js";
import { articleRepository } from "../repositories/articleRepository.js";
import { locationRepository } from "../repositories/locationRepository.js";
import { stockRepository } from "../repositories/stockRepository.js";
import { stockMovementRepository } from "../repositories/stockMovementRepository.js";
import { db } from "../db/index.js";

vi.mock("../db/index.js", () => ({
  db: { transaction: (fn: (tx: unknown) => unknown) => fn({}) },
}));

vi.mock("../repositories/articleRepository.js", () => ({
  articleRepository: { findById: vi.fn() },
}));

vi.mock("../repositories/locationRepository.js", () => ({
  locationRepository: { findById: vi.fn() },
}));

vi.mock("../repositories/stockRepository.js", () => ({
  stockRepository: {
    findByArticleAndLocation: vi.fn(),
    increment: vi.fn(),
    decrement: vi.fn(),
  },
}));

vi.mock("../repositories/stockMovementRepository.js", () => ({
  stockMovementRepository: { create: vi.fn(), findAll: vi.fn() },
}));

const activeArticle = {
  id: 1,
  reference: "SKU-001",
  name: "Test",
  description: null,
  barcode: null,
  unit: "unité",
  minimumStock: 0,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const inactiveArticle = { ...activeArticle, active: false };

const activeLocation = {
  id: 1,
  name: "A-01-01",
  code: "A-01-01",
  capacity: 1000,
  zoneId: 1,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const inactiveLocation = { ...activeLocation, active: false };

describe("stockMovementService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuse une quantité nulle ou négative", async () => {
    await expect(
      stockMovementService.create({ type: "IN", articleId: 1, quantity: 0, destinationLocationId: 1, userId: 1 }),
    ).rejects.toMatchObject({ status: 400, code: "QUANTITY_MUST_BE_POSITIVE" });
  });

  it("refuse un produit désactivé", async () => {
    vi.mocked(articleRepository.findById).mockResolvedValue(inactiveArticle);

    await expect(
      stockMovementService.create({ type: "IN", articleId: 1, quantity: 10, destinationLocationId: 1, userId: 1 }),
    ).rejects.toMatchObject({ status: 409, code: "ARTICLE_INACTIVE" });
  });

  it("refuse un emplacement désactivé", async () => {
    vi.mocked(articleRepository.findById).mockResolvedValue(activeArticle);
    vi.mocked(locationRepository.findById).mockResolvedValue(inactiveLocation);

    await expect(
      stockMovementService.create({ type: "IN", articleId: 1, quantity: 10, destinationLocationId: 1, userId: 1 }),
    ).rejects.toMatchObject({ status: 409, code: "LOCATION_INACTIVE" });
  });

  it("crée une entrée IN et incrémente le stock à la destination", async () => {
    vi.mocked(articleRepository.findById).mockResolvedValue(activeArticle);
    vi.mocked(locationRepository.findById).mockResolvedValue(activeLocation);
    vi.mocked(stockMovementRepository.create).mockResolvedValue({
      id: 1,
      type: "IN",
      articleId: 1,
      quantity: 10,
      sourceLocationId: null,
      destinationLocationId: 1,
      userId: 1,
      reason: null,
      createdAt: new Date(),
    });

    const result = await stockMovementService.create({
      type: "IN",
      articleId: 1,
      quantity: 10,
      destinationLocationId: 1,
      userId: 1,
    });

    expect(result.type).toBe("IN");
    expect(stockRepository.increment).toHaveBeenCalledWith(1, 1, 10, {});
  });

  it("crée une sortie OUT et décrémente le stock source", async () => {
    vi.mocked(articleRepository.findById).mockResolvedValue(activeArticle);
    vi.mocked(locationRepository.findById).mockResolvedValue(activeLocation);
    vi.mocked(stockRepository.findByArticleAndLocation).mockResolvedValue({
      id: 1,
      articleId: 1,
      locationId: 1,
      quantity: 20,
      updatedAt: new Date(),
    });
    vi.mocked(stockMovementRepository.create).mockResolvedValue({
      id: 2,
      type: "OUT",
      articleId: 1,
      quantity: 5,
      sourceLocationId: 1,
      destinationLocationId: null,
      userId: 1,
      reason: null,
      createdAt: new Date(),
    });

    const result = await stockMovementService.create({
      type: "OUT",
      articleId: 1,
      quantity: 5,
      sourceLocationId: 1,
      userId: 1,
    });

    expect(result.type).toBe("OUT");
    expect(stockRepository.decrement).toHaveBeenCalledWith(1, 1, 5, {});
  });

  it("refuse une sortie quand le stock est insuffisant", async () => {
    vi.mocked(articleRepository.findById).mockResolvedValue(activeArticle);
    vi.mocked(locationRepository.findById).mockResolvedValue(activeLocation);
    vi.mocked(stockRepository.findByArticleAndLocation).mockResolvedValue({
      id: 1,
      articleId: 1,
      locationId: 1,
      quantity: 5,
      updatedAt: new Date(),
    });

    await expect(
      stockMovementService.create({
        type: "OUT",
        articleId: 1,
        quantity: 100,
        sourceLocationId: 1,
        userId: 1,
      }),
    ).rejects.toMatchObject({ status: 409, code: "INSUFFICIENT_STOCK" });
  });

  it("effectue un transfert : décrémente la source et incrémente la destination", async () => {
    vi.mocked(articleRepository.findById).mockResolvedValue(activeArticle);
    vi.mocked(locationRepository.findById).mockImplementation(async (id) => ({
      ...activeLocation,
      id,
    }));
    vi.mocked(stockRepository.findByArticleAndLocation).mockResolvedValue({
      id: 1,
      articleId: 1,
      locationId: 1,
      quantity: 20,
      updatedAt: new Date(),
    });
    vi.mocked(stockMovementRepository.create).mockResolvedValue({
      id: 3,
      type: "TRANSFER",
      articleId: 1,
      quantity: 7,
      sourceLocationId: 1,
      destinationLocationId: 2,
      userId: 1,
      reason: null,
      createdAt: new Date(),
    });

    const result = await stockMovementService.create({
      type: "TRANSFER",
      articleId: 1,
      quantity: 7,
      sourceLocationId: 1,
      destinationLocationId: 2,
      userId: 1,
    });

    expect(result.type).toBe("TRANSFER");
    expect(stockRepository.decrement).toHaveBeenCalledWith(1, 1, 7, {});
    expect(stockRepository.increment).toHaveBeenCalledWith(1, 2, 7, {});
  });

  it("refuse un transfert quand le stock source est insuffisant", async () => {
    vi.mocked(articleRepository.findById).mockResolvedValue(activeArticle);
    vi.mocked(locationRepository.findById).mockImplementation(async (id) => ({
      ...activeLocation,
      id,
    }));
    vi.mocked(stockRepository.findByArticleAndLocation).mockResolvedValue({
      id: 1,
      articleId: 1,
      locationId: 1,
      quantity: 3,
      updatedAt: new Date(),
    });

    await expect(
      stockMovementService.create({
        type: "TRANSFER",
        articleId: 1,
        quantity: 10,
        sourceLocationId: 1,
        destinationLocationId: 2,
        userId: 1,
      }),
    ).rejects.toMatchObject({ status: 409, code: "INSUFFICIENT_STOCK" });
  });

  it("refuse un transfert vers le même emplacement", async () => {
    vi.mocked(articleRepository.findById).mockResolvedValue(activeArticle);

    await expect(
      stockMovementService.create({
        type: "TRANSFER",
        articleId: 1,
        quantity: 5,
        sourceLocationId: 1,
        destinationLocationId: 1,
        userId: 1,
      }),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_MOVEMENT" });
  });
});