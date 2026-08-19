import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "./authService.js";
import { userRepository } from "../repositories/userRepository.js";

const { compareMock, hashMock } = vi.hoisted(() => ({
  compareMock: vi.fn<(password: string, encrypted: string) => Promise<boolean>>(),
  hashMock: vi.fn<(password: string, saltRounds: number) => Promise<string>>(),
}));

vi.mock("../repositories/userRepository.js", () => ({
  userRepository: { findByEmail: vi.fn(), findById: vi.fn(), create: vi.fn() },
}));

vi.mock("bcryptjs", () => ({
  default: { compare: compareMock, hash: hashMock },
  compare: compareMock,
  hash: hashMock,
}));

const user = {
  id: 1,
  firstName: "Alice",
  lastName: "Admin",
  email: "admin@wms.local",
  passwordHash: "hash",
  role: "ADMIN",
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("authService.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("connecte un utilisateur valide et retourne un token", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);
    compareMock.mockResolvedValue(true);

    const result = await authService.login("admin@wms.local", "admin123");

    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe("admin@wms.local");
    expect(result.user.role).toBe("ADMIN");
  });

  it("refuse un mauvais mot de passe", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(user);
    compareMock.mockResolvedValue(false);

    await expect(authService.login("admin@wms.local", "mauvais")).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("refuse un utilisateur inexistant", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(undefined);

    await expect(authService.login("ghost@wms.local", "x")).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("refuse un utilisateur désactivé", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue({ ...user, active: false });

    await expect(authService.login("admin@wms.local", "admin123")).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
    });
  });
});