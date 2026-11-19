import "server-only";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireEnv } from "./server/env";

const ISSUER = "attendx";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: { id: string; username: string }): string {
  return jwt.sign(payload, requireEnv("JWT_SECRET"), {
    algorithm: "HS256",
    expiresIn: "30d",
    issuer: ISSUER,
  });
}

export function verifyToken(token: string): { id: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, requireEnv("JWT_SECRET"), { algorithms: ["HS256"] });
    if (typeof decoded !== "object" || !decoded || typeof (decoded as any).id === "undefined") return null;
    // Tokens issued before the issuer claim existed remain valid until they expire.
    if ((decoded as any).iss && (decoded as any).iss !== ISSUER) return null;
    return { id: String((decoded as any).id), username: String((decoded as any).username || "") };
  } catch {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const t = authHeader.substring(7).trim();
  return t.length > 0 && t.length < 2048 ? t : null;
}

export function authenticate(req: Request) {
  const token = extractTokenFromHeader(req.headers.get("authorization"));
  return token ? verifyToken(token) : null;
}
