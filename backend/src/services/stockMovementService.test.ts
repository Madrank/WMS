import { describe, it, expect, vi } from "vitest";
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

describe("stockMovementService.create", () => {
  it("refuse une sortie quand le stock est insuffisant", async () => {
    vi.mocked(articleRepository.findById).mockResolvedValue({
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
    });

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

  it("crée une entrée IN et incrémente le stock à la destination", async () => {
    vi.mocked(articleRepository.findById).mockResolvedValue({
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
    });

    vi.mocked(locationRepository.findById).mockResolvedValue({
      id: 1,
      name: "A-01-01",
      code: "A-01-01",
      capacity: 1000,
      zoneId: 1,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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

  it("refuse un transfert vers le même emplacement", async () => {
    vi.mocked(articleRepository.findById).mockResolvedValue({
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
    });

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