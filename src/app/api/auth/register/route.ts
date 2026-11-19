import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, name, branch, totalHeld, academicPresent } = body;

    if (!username?.trim() || !password || !name?.trim()) {
      return NextResponse.json(
        { error: "Admission Number, Full Name, and Password are all mandatory." },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const cleanName = name.trim();

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM attendx_web_users WHERE LOWER(username) = LOWER(${cleanUsername}) LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ error: "This Admission Number is already registered. Please sign in." }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const initialHeld = totalHeld !== undefined ? Math.max(1, Number(totalHeld)) : 421;
    const initialPresent = academicPresent !== undefined ? Math.max(0, Number(academicPresent)) : 316;

    const inserted = await sql`
      INSERT INTO attendx_web_users (
        username,
        password_hash,
        name,
        branch,
        total_held,
        academic_present,
        factor_buffer,
        thursday_held,
        thursday_present
      ) VALUES (
        ${cleanUsername},
        ${hashedPassword},
        ${cleanName},
        ${branch?.trim() || "AIML-3A"},
        ${initialHeld},
        ${initialPresent},
        16,
        3,
        3
      ) RETURNING id, username, name, branch, total_held, academic_present, thursday_held, thursday_present, target_percentage
    `;

    const user = inserted[0];
    const token = createToken({ id: user.id, username: user.username });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        branch: user.branch,
        totalHeld: user.total_held,
        academicPresent: user.academic_present,
        thursdayHeld: user.thursday_held,
        thursdayPresent: user.thursday_present,
        targetPercentage: user.target_percentage,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
