import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";
import { calculateAttendanceMetrics } from "@/lib/attendanceEngine";

export async function PUT(req: Request) {
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

    const body = await req.json();
    const { totalHeld, academicPresent, thursdayHeld, thursdayPresent, targetPercentage, branch } = body;

    const updated = await sql`
      UPDATE attendx_web_users
      SET
        total_held = COALESCE(${totalHeld !== undefined ? Number(totalHeld) : null}, total_held),
        academic_present = COALESCE(${academicPresent !== undefined ? Number(academicPresent) : null}, academic_present),
        thursday_held = COALESCE(${thursdayHeld !== undefined ? Number(thursdayHeld) : null}, thursday_held),
        thursday_present = COALESCE(${thursdayPresent !== undefined ? Number(thursdayPresent) : null}, thursday_present),
        target_percentage = COALESCE(${targetPercentage !== undefined ? Number(targetPercentage) : null}, target_percentage),
        branch = COALESCE(${branch ? branch.trim() : null}, branch),
        updated_at = now()
      WHERE id = ${payload.id}
      RETURNING id, username, name, branch, sem, total_held, academic_present, factor_buffer, thursday_held, thursday_present, target_percentage
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = updated[0];
    const metrics = calculateAttendanceMetrics(
      user.total_held,
      user.academic_present,
      user.thursday_held,
      user.thursday_present,
      user.target_percentage || 75,
      user.factor_buffer || 16
    );

    return NextResponse.json({
      success: true,
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
      metrics,
    });
  } catch (error: any) {
    console.error("Attendance update error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
