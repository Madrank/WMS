import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET ?? "dev-secret";

export function signToken(payload: { userId: number; role: string }): string {
  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "8h") as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string) {
  return jwt.verify(token, secret) as { userId: number; role: string };
}
