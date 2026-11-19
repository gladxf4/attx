import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";
import { clientIp, rateLimit, tooMany } from "@/lib/server/rateLimit";
import { sanitizeSubjects, serializeUser, serverError } from "@/lib/server/userRow";

export const dynamic = "force-dynamic";

function int(v: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

export async function POST(req: Request) {
  try {
    const rl = rateLimit(`register:${clientIp(req)}`, 5, 60 * 60_000);
    if (!rl.ok) return tooMany(rl.retryAfter);

    const body = await req.json().catch(() => null);
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !name || !password) {
      return NextResponse.json({ error: "Admission number, name and password are required." }, { status: 400 });
    }
    if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) {
      return NextResponse.json({ error: "Admission number can only contain letters, numbers, dots and dashes." }, { status: 400 });
    }
    if (name.length > 80) {
      return NextResponse.json({ error: "Name is too long." }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Password must be 8–128 characters." }, { status: 400 });
    }

    const existing = await sql`
      SELECT id FROM attendx_web_users WHERE LOWER(username) = LOWER(${username}) LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: "This admission number is already registered. Sign in instead." }, { status: 409 });
    }

    // Optional starting numbers (from guest mode). Present is already the official count.
    const a = body?.attendance ?? {};
    const held = int(a.baselineHeld, 0, 5000, 0);
    const present = int(a.baselinePresent, 0, held, 0);
    const todayHeld = int(a.todayHeld, 0, 12, 0);
    const todayPresent = int(a.todayPresent, 0, todayHeld, 0);
    const target = int(a.targetPercentage, 50, 100, 75);
    const subjects = sanitizeSubjects(body?.subjects) ?? [];

    const hashed = await hashPassword(password);
    const inserted = await sql`
      INSERT INTO attendx_web_users (
        username, password_hash, name, total_held, academic_present, factor_buffer,
        thursday_held, thursday_present, target_percentage, custom_subjects
      ) VALUES (
        ${username}, ${hashed}, ${name}, ${held}, ${present}, 0,
        ${todayHeld}, ${todayPresent}, ${target}, ${JSON.stringify(subjects)}::jsonb
      )
      RETURNING id, username, name, total_held, academic_present, factor_buffer, thursday_held,
                thursday_present, target_percentage, custom_subjects, updated_at
    `;

    const row = inserted[0];
    const token = createToken({ id: String(row.id), username: String(row.username) });
    return NextResponse.json({ token, ...serializeUser(row) });
  } catch (error) {
    return serverError("auth/register", error);
  }
}
