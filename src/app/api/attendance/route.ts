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
    const { totalHeld, academicPresent, thursdayHeld, thursdayPresent, targetPercentage, branch, factorBuffer, custom_subjects } = body;

    // Strict input sanitization against poisoning / negative / overflow values
    const cleanHeld = totalHeld !== undefined && !isNaN(Number(totalHeld)) ? Math.max(0, Math.min(2500, Math.round(Number(totalHeld)))) : null;
    const cleanPresent = academicPresent !== undefined && !isNaN(Number(academicPresent)) ? Math.max(0, Math.min(cleanHeld ?? 2500, Math.round(Number(academicPresent)))) : null;
    const cleanBuffer = factorBuffer !== undefined && !isNaN(Number(factorBuffer)) ? Math.max(0, Math.min(300, Math.round(Number(factorBuffer)))) : null;
    const cleanTodayHeld = thursdayHeld !== undefined && !isNaN(Number(thursdayHeld)) ? Math.max(0, Math.min(8, Math.round(Number(thursdayHeld)))) : null;
    const cleanTodayPresent = thursdayPresent !== undefined && !isNaN(Number(thursdayPresent)) ? Math.max(0, Math.min(cleanTodayHeld ?? 8, Math.round(Number(thursdayPresent)))) : null;
    const cleanTargetPct = targetPercentage !== undefined && !isNaN(Number(targetPercentage)) ? Math.max(50, Math.min(100, Math.round(Number(targetPercentage)))) : null;
    const cleanBranch = branch && typeof branch === "string" ? branch.trim().substring(0, 50) : null;

    let sanitizedSubjects = null;
    if (custom_subjects && Array.isArray(custom_subjects)) {
      sanitizedSubjects = custom_subjects.slice(0, 40).map((s: any) => ({
        code: String(s.code || "").trim().substring(0, 30),
        name: String(s.name || "").trim().substring(0, 100),
        held: Math.max(0, Math.min(200, Math.round(Number(s.held) || 0))),
        pres: Math.max(0, Math.min(200, Math.round(Number(s.pres) || 0))),
        abs: Math.max(0, Math.min(200, Math.round(Number(s.abs) || 0))),
        pct: Math.max(0, Math.min(100, Number(s.pct) || 0)),
        needed75: Math.max(0, Math.min(100, Math.round(Number(s.needed75) || 0))),
        isLab: Boolean(s.isLab),
        todayHeld: Math.max(0, Math.min(8, Math.round(Number(s.todayHeld) || 0))),
        todayPresent: Math.max(0, Math.min(8, Math.round(Number(s.todayPresent) || 0))),
      }));
    }

    const subjectsJson = sanitizedSubjects !== null ? JSON.stringify(sanitizedSubjects) : null;

    const updated = await sql`
      UPDATE attendx_web_users
      SET
        total_held = COALESCE(${cleanHeld}, total_held),
        academic_present = COALESCE(${cleanPresent}, academic_present),
        factor_buffer = COALESCE(${cleanBuffer}, factor_buffer),
        thursday_held = COALESCE(${cleanTodayHeld}, thursday_held),
        thursday_present = COALESCE(${cleanTodayPresent}, thursday_present),
        target_percentage = COALESCE(${cleanTargetPct}, target_percentage),
        branch = COALESCE(${cleanBranch}, branch),
        custom_subjects = COALESCE(${subjectsJson}::jsonb, custom_subjects),
        updated_at = now()
      WHERE id = ${payload.id}
      RETURNING id, username, name, branch, sem, total_held, academic_present, factor_buffer, thursday_held, thursday_present, target_percentage, custom_subjects
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
      user.factor_buffer !== null && user.factor_buffer !== undefined ? Number(user.factor_buffer) : 0
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
        custom_subjects: user.custom_subjects,
      },
      metrics,
    });
  } catch (error: any) {
    console.error("Attendance update error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
