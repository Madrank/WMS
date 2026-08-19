import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { requireAuth } from "./auth.js";

const { verifyMock } = vi.hoisted(() => ({
  verifyMock: vi.fn<(token: string) => { userId: number; role: string }>(),
}));

vi.mock("../utils/jwt.js", () => ({
  verifyToken: verifyMock,
}));

function mockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function mockRequest(headers: Record<string, string> = {}) {
  return { headers } as unknown as Request;
}

describe("requireAuth (route protégée)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuse une requête sans jeton (401)", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "UNAUTHORIZED", message: expect.any(String) },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("refuse un header Authorization sans préfixe Bearer (401)", () => {
    const req = mockRequest({ authorization: "Token brut" });
    const res = mockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("refuse un jeton invalide ou expiré (401)", () => {
    verifyMock.mockImplementation(() => {
      throw new Error("invalid token");
    });
    const req = mockRequest({ authorization: "Bearer jeton-invalide" });
    const res = mockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: "UNAUTHORIZED", message: expect.any(String) },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("laisse passer un jeton valide et place l'utilisateur dans la requête", () => {
    verifyMock.mockReturnValue({ userId: 1, role: "ADMIN" });
    const req = mockRequest({ authorization: "Bearer jeton-valide" });
    const res = mockResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(verifyMock).toHaveBeenCalledWith("jeton-valide");
    expect(next).toHaveBeenCalledTimes(1);
    expect((req as { user?: { userId: number; role: string } }).user).toEqual({
      userId: 1,
      role: "ADMIN",
    });
  });
});