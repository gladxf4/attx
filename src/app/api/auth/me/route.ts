import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { authenticate } from "@/lib/auth";
import { serializeUser, serverError } from "@/lib/server/userRow";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const payload = authenticate(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await sql`
      SELECT id, username, name, total_held, academic_present, factor_buffer, thursday_held,
             thursday_present, target_percentage, custom_subjects, updated_at
      FROM attendx_web_users
      WHERE id = ${payload.id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(serializeUser(rows[0]), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return serverError("auth/me", error);
  }
}
