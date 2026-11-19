import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { authenticate } from "@/lib/auth";
import { sanitizeSubjects, serializeUser, serverError } from "@/lib/server/userRow";
import { clientIp, rateLimit, tooMany } from "@/lib/server/rateLimit";

export const dynamic = "force-dynamic";

function int(v: unknown, min: number, max: number): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

export async function PUT(req: Request) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`att:${payload.id}:${clientIp(req)}`, 120, 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const held = int(body.baselineHeld, 0, 5000);
    const present = held === null ? null : int(body.baselinePresent, 0, held);
    const todayHeld = int(body.todayHeld, 0, 12);
    const todayPresent = todayHeld === null ? null : int(body.todayPresent, 0, todayHeld);
    const target = int(body.targetPercentage, 50, 100);
    const subjects = sanitizeSubjects(body.subjects);
    const subjectsJson = subjects ? JSON.stringify(subjects) : null;

    // When both baseline numbers arrive, the present count is already official,
    // so the legacy separate credit column is cleared.
    const writesBaseline = held !== null && present !== null;

    const rows = await sql`
      UPDATE attendx_web_users
      SET
        total_held = COALESCE(${writesBaseline ? held : null}, total_held),
        academic_present = COALESCE(${writesBaseline ? present : null}, academic_present),
        factor_buffer = CASE WHEN ${writesBaseline}::boolean THEN 0 ELSE factor_buffer END,
        thursday_held = COALESCE(${todayHeld}, thursday_held),
        thursday_present = COALESCE(${todayPresent}, thursday_present),
        target_percentage = COALESCE(${target}, target_percentage),
        custom_subjects = COALESCE(${subjectsJson}::jsonb, custom_subjects),
        updated_at = now()
      WHERE id = ${payload.id}
      RETURNING id, username, name, total_held, academic_present, factor_buffer, thursday_held,
                thursday_present, target_percentage, custom_subjects, updated_at
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ success: true, ...serializeUser(rows[0]) });
  } catch (error) {
    return serverError("attendance PUT", error);
  }
}
