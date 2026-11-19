import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { requireEnv } from "./env";

// AES-256-GCM sealed blobs. Used so ERP credentials and session cookies are never
// handed to the browser in readable form; the client only stores opaque tokens.

function key(): Buffer {
  const secret = process.env.ERP_SEAL_SECRET || `${requireEnv("JWT_SECRET")}::attendx-erp-seal`;
  return createHash("sha256").update(secret).digest();
}

export function seal(payload: object, ttlSeconds: number): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = JSON.stringify({ ...payload, exp: Date.now() + ttlSeconds * 1000 });
  const ct = Buffer.concat([cipher.update(body, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64url");
}

export function unseal<T = Record<string, unknown>>(token: unknown): T | null {
  if (typeof token !== "string" || token.length < 40 || token.length > 16_000) return null;
  try {
    const raw = Buffer.from(token, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ct = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const body = JSON.parse(Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8"));
    if (typeof body?.exp !== "number" || body.exp < Date.now()) return null;
    return body as T;
  } catch {
    return null;
  }
}
