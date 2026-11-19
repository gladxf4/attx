import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { calculateAttendanceMetrics } from "@/lib/attendanceEngine";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const rows = await sql`
      SELECT id, username, name, branch, sem, total_held, academic_present, factor_buffer, thursday_held, thursday_present, target_percentage
      FROM attendx_web_users
      WHERE id = ${payload.id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = rows[0];
    const metrics = calculateAttendanceMetrics(
      user.total_held,
      user.academic_present,
      user.thursday_held,
      user.thursday_present,
      user.target_percentage || 75,
      user.factor_buffer || 16
    );

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        branch: user.branch,
        sem: user.sem,
        totalHeld: user.total_held,
        academicPresent: user.academic_present,
        thursdayHeld: user.thursday_held,
        thursdayPresent: user.thursday_present,
        targetPercentage: user.target_percentage,
      },
      metrics,
    });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
