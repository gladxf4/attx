import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { comparePassword, createToken } from "@/lib/auth";
import { clientIp, rateLimit, tooMany } from "@/lib/server/rateLimit";
import { serializeUser, serverError } from "@/lib/server/userRow";

export const dynamic = "force-dynamic";

// Constant-time-ish path for unknown users so response timing doesn't reveal accounts.
const DUMMY_HASH = "$2a$12$HSGXDCmJOXfH4.sCKtZ4ROrUe6J/FkojutqZEFcqMo0OaBKG/UeBC";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const ipLimit = rateLimit(`login-ip:${ip}`, 20, 10 * 60_000);
    if (!ipLimit.ok) return tooMany(ipLimit.retryAfter);

    const body = await req.json().catch(() => null);
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password || username.length > 64 || password.length > 256) {
      return NextResponse.json({ error: "Enter your admission number and password." }, { status: 400 });
    }

    const userLimit = rateLimit(`login-user:${username.toLowerCase()}`, 8, 10 * 60_000);
    if (!userLimit.ok) return tooMany(userLimit.retryAfter);

    const rows = await sql`
      SELECT id, username, name, password_hash, total_held, academic_present, factor_buffer, thursday_held,
             thursday_present, target_percentage, custom_subjects, updated_at
      FROM attendx_web_users
      WHERE LOWER(username) = LOWER(${username})
      LIMIT 1
    `;

    const row = rows[0];
    const ok = await comparePassword(password, row?.password_hash || DUMMY_HASH);
    if (!row || !ok) {
      return NextResponse.json({ error: "Incorrect admission number or password." }, { status: 401 });
    }

    const token = createToken({ id: String(row.id), username: String(row.username) });
    return NextResponse.json({ token, ...serializeUser(row) });
  } catch (error) {
    return serverError("auth/login", error);
  }
}
