import { describe, it, expect, vi, beforeEach } from "vitest";
import { receiptService } from "./receiptService.js";
import { receiptRepository } from "../repositories/receiptRepository.js";
import { supplierRepository } from "../repositories/supplierRepository.js";
import { stockMovementRepository } from "../repositories/stockMovementRepository.js";
import { stockRepository } from "../repositories/stockRepository.js";
import { db } from "../db/index.js";

vi.mock("../db/index.js", () => ({
  db: { transaction: (fn: (tx: unknown) => unknown) => fn({}) },
}));

vi.mock("../repositories/receiptRepository.js", () => ({
  receiptRepository: {
    findByReference: vi.fn(),
    findById: vi.fn(),
    findItemsByReceiptId: vi.fn(),
    create: vi.fn(),
    createItems: vi.fn(),
    setStatus: vi.fn(),
  },
}));

vi.mock("../repositories/supplierRepository.js", () => ({
  supplierRepository: { findById: vi.fn() },
}));

vi.mock("../repositories/stockMovementRepository.js", () => ({
  stockMovementRepository: { create: vi.fn(), findAll: vi.fn() },
}));

vi.mock("../repositories/stockRepository.js", () => ({
  stockRepository: { increment: vi.fn(), decrement: vi.fn() },
}));

const draftReceipt = {
  id: 1,
  reference: "REC-0001",
  supplierId: 1,
  status: "DRAFT",
  createdBy: 1,
  validatedBy: null,
  validatedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("receiptService.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crée une réception DRAFT avec ses lignes", async () => {
    vi.mocked(receiptRepository.findByReference).mockResolvedValue(undefined);
    vi.mocked(supplierRepository.findById).mockResolvedValue({
      id: 1,
      name: "ACME",
      email: null,
      phone: null,
      address: null,
      city: null,
      postalCode: null,
      country: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(receiptRepository.create).mockResolvedValue(draftReceipt);
    vi.mocked(receiptRepository.createItems).mockResolvedValue([
      { id: 1, receiptId: 1, articleId: 1, expectedQuantity: 10, receivedQuantity: 10, locationId: 1 },
    ]);

    const result = await receiptService.create({
      reference: "REC-0001",
      supplierId: 1,
      createdBy: 1,
      items: [{ articleId: 1, expectedQuantity: 10, receivedQuantity: 10, locationId: 1 }],
    });

    expect(result.status).toBe("DRAFT");
    expect(receiptRepository.createItems).toHaveBeenCalledTimes(1);
    expect(result.items).toHaveLength(1);
  });

  it("refuse une réception sans articles", async () => {
    await expect(
      receiptService.create({ reference: "REC-0002", supplierId: 1, createdBy: 1, items: [] }),
    ).rejects.toMatchObject({ status: 400, code: "EMPTY_RECEIPT" });
  });

  it("refuse une référence déjà utilisée", async () => {
    vi.mocked(receiptRepository.findByReference).mockResolvedValue(draftReceipt);

    await expect(
      receiptService.create({
        reference: "REC-0001",
        supplierId: 1,
        createdBy: 1,
        items: [{ articleId: 1, expectedQuantity: 10, locationId: 1 }],
      }),
    ).rejects.toMatchObject({ status: 409, code: "REFERENCE_ALREADY_USED" });
  });

  it("refuse un fournisseur inexistant", async () => {
    vi.mocked(receiptRepository.findByReference).mockResolvedValue(undefined);
    vi.mocked(supplierRepository.findById).mockResolvedValue(undefined);

    await expect(
      receiptService.create({
        reference: "REC-0003",
        supplierId: 99,
        createdBy: 1,
        items: [{ articleId: 1, expectedQuantity: 10, locationId: 1 }],
      }),
    ).rejects.toMatchObject({ status: 404, code: "SUPPLIER_NOT_FOUND" });
  });
});

describe("receiptService.validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("valide une réception : crée les mouvements IN et incrémente le stock", async () => {
    vi.mocked(receiptRepository.findById).mockResolvedValue(draftReceipt);
    vi.mocked(receiptRepository.findItemsByReceiptId).mockResolvedValue([
      { id: 1, receiptId: 1, articleId: 1, expectedQuantity: 10, receivedQuantity: 8, locationId: 1 },
      { id: 2, receiptId: 1, articleId: 2, expectedQuantity: 5, receivedQuantity: 5, locationId: 2 },
    ]);
    vi.mocked(receiptRepository.setStatus).mockResolvedValue({
      ...draftReceipt,
      status: "VALIDATED",
      validatedBy: 9,
      validatedAt: new Date(),
    });

    const result = await receiptService.validate(1, 9);

    expect(result.status).toBe("VALIDATED");
    expect(stockMovementRepository.create).toHaveBeenCalledTimes(2);
    expect(stockMovementRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "IN", articleId: 1, quantity: 8, destinationLocationId: 1 }),
      {},
    );
    expect(stockMovementRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "IN", articleId: 2, quantity: 5, destinationLocationId: 2 }),
      {},
    );
    expect(stockRepository.increment).toHaveBeenCalledWith(1, 1, 8, {});
    expect(stockRepository.increment).toHaveBeenCalledWith(2, 2, 5, {});
  });

  it("refuse de valider une réception déjà validée", async () => {
    vi.mocked(receiptRepository.findById).mockResolvedValue({
      ...draftReceipt,
      status: "VALIDATED",
    });

    await expect(receiptService.validate(1, 9)).rejects.toMatchObject({
      status: 409,
      code: "RECEIPT_ALREADY_VALIDATED",
    });
  });

  it("refuse une quantité reçue nulle lors de la validation", async () => {
    vi.mocked(receiptRepository.findById).mockResolvedValue(draftReceipt);
    vi.mocked(receiptRepository.findItemsByReceiptId).mockResolvedValue([
      { id: 1, receiptId: 1, articleId: 1, expectedQuantity: 10, receivedQuantity: 0, locationId: 1 },
    ]);

    await expect(receiptService.validate(1, 9)).rejects.toMatchObject({
      status: 400,
      code: "QUANTITY_MUST_BE_POSITIVE",
    });
  });
});