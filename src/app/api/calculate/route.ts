import { NextResponse } from "next/server";
import { calculateAttendanceMetrics, CALENDAR_DAYS_UNTIL_MT2 } from "@/lib/attendanceEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      totalHeld = 421,
      academicPresent = 316,
      thursdayHeld = 3,
      thursdayPresent = 3,
      targetPercentage = 75,
      simulateFutureClasses,
      simulateAttendedClasses,
    } = body;

    const baseMetrics = calculateAttendanceMetrics(
      Number(totalHeld),
      Number(academicPresent),
      Number(thursdayHeld),
      Number(thursdayPresent),
      Number(targetPercentage),
      16 // Protected server-side institutional factor
    );

    let simulation = null;
    if (simulateFutureClasses !== undefined && simulateAttendedClasses !== undefined) {
      const simHeld = baseMetrics.currentTotalHeld + Number(simulateFutureClasses);
      const simPresent = baseMetrics.currentTotalPresent + Number(simulateAttendedClasses);
      const simPct = simHeld > 0 ? (simPresent / simHeld) * 100 : 0;
      simulation = {
        simulatedTotalHeld: simHeld,
        simulatedTotalPresent: simPresent,
        simulatedPercentage: Number(simPct.toFixed(2)),
        isEligible: simPct >= targetPercentage,
      };
    }

    return NextResponse.json({
      metrics: baseMetrics,
      calendar: CALENDAR_DAYS_UNTIL_MT2,
      simulation,
    });
  } catch (error: any) {
    console.error("Calculate error:", error);
    return NextResponse.json({ error: error.message || "Calculation failed" }, { status: 500 });
  }
}
