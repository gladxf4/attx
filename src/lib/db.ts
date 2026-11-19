import "server-only";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { requireEnv } from "./server/env";

let client: NeonQueryFunction<false, false> | null = null;

function getClient() {
  if (!client) client = neon(requireEnv("NEON_URL"));
  return client;
}

/** Lazily-initialised tagged-template client so builds don't need DB secrets. */
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return getClient()(strings, ...values) as Promise<Record<string, any>[]>;
}
