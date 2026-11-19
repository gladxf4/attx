import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { comparePassword, createToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, username, password_hash, name, branch, total_held, academic_present, factor_buffer, thursday_held, thursday_present, target_percentage
      FROM attendx_web_users
      WHERE LOWER(username) = LOWER(${username.trim()})
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const user = rows[0];
    const isMatch = await comparePassword(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

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
    console.error("Login error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
