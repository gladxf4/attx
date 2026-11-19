import "server-only";
import { SubjectRecord } from "../types";

/**
 * Shapes a DB row for the client. Older rows stored the official credit as a
 * separate column; it is folded in here so the client only ever sees the
 * official present count.
 */
export function serializeUser(row: Record<string, any>) {
  const held = Math.max(0, Number(row.total_held) || 0);
  const official = Math.min(held, Math.max(0, Number(row.academic_present) || 0) + Math.max(0, Number(row.factor_buffer) || 0));
  return {
    user: {
      id: String(row.id),
      username: String(row.username),
      name: row.name ? String(row.name) : undefined,
    },
    attendance: {
      baselineHeld: held,
      baselinePresent: official,
      todayHeld: Math.max(0, Number(row.thursday_held) || 0),
      todayPresent: Math.max(0, Number(row.thursday_present) || 0),
      targetPercentage: Number(row.target_percentage) || 75,
    },
    subjects: Array.isArray(row.custom_subjects) ? (row.custom_subjects as SubjectRecord[]) : [],
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

export function sanitizeSubjects(input: unknown): SubjectRecord[] | null {
  if (!Array.isArray(input)) return null;
  return input.slice(0, 40).map((s: any) => ({
    code: String(s?.code ?? "").trim().substring(0, 30),
    name: String(s?.name ?? "").trim().substring(0, 100),
    held: Math.max(0, Math.min(500, Math.round(Number(s?.held) || 0))),
    pres: Math.max(0, Math.min(500, Math.round(Number(s?.pres) || 0))),
    abs: Math.max(0, Math.min(500, Math.round(Number(s?.abs) || 0))),
    pct: Math.max(0, Math.min(100, Number(s?.pct) || 0)),
    needed75: Math.max(0, Math.min(500, Math.round(Number(s?.needed75) || 0))),
    isLab: Boolean(s?.isLab),
    todayHeld: Math.max(0, Math.min(12, Math.round(Number(s?.todayHeld) || 0))),
    todayPresent: Math.max(0, Math.min(12, Math.round(Number(s?.todayPresent) || 0))),
  }));
}

export function serverError(context: string, err: unknown) {
  console.error(`${context}:`, err instanceof Error ? err.message : err);
  return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
