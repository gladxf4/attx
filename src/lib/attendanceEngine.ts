import { AcademicCalendar, isWorkingDay, upcomingWorkingDays } from "./academicCalendar";
import { AttendanceInput, AttendanceMetrics, Horizon, PlanMap } from "./types";

export function isLabSubject(code?: string, name?: string): boolean {
  const c = (code || "").trim();
  const n = (name || "").toLowerCase().trim();

  // ABES practical codes carry a 5 in the tens place (25CS352 vs 25CS302)
  if (/\d{2}[A-Za-z]{2,4}\d5\d/i.test(c)) return true;
  if (/5\d$/.test(c)) return true;
  if (/L$/i.test(c)) return true;

  return (
    n.includes("lab") ||
    n.includes("workshop") ||
    n.includes("cloud") ||
    n.includes("web dev") ||
    n.includes("web design") ||
    n.includes("employability") ||
    n.includes("practical") ||
    n.includes("embedded") ||
    /\bes\b/i.test(n) ||
    n.includes("holistic") ||
    n.includes("skill")
  );
}

export function clampInt(v: unknown, min: number, max: number, fallback = min): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/** Converts the three numbers a student reads off the ERP into the official present count. */
export function officialPresentFrom(held: number, attended: number, officialPct?: number | null): number {
  const h = Math.max(0, Math.round(held));
  const a = Math.max(0, Math.min(h, Math.round(attended)));
  if (officialPct === undefined || officialPct === null || !Number.isFinite(officialPct) || officialPct <= 0) return a;
  const fromPct = Math.round((Math.min(100, officialPct) / 100) * h);
  return Math.max(a, Math.min(h, fromPct));
}

export function pct(present: number, held: number): number {
  return held > 0 ? (present / held) * 100 : 0;
}

export function formatPct(v: number, digits = 2): string {
  return `${(Math.round(v * 10 ** digits) / 10 ** digits).toFixed(digits)}%`;
}

/**
 * Expresses lectures as days, rounded down to the nearest half day so it never
 * overstates a safe-skip budget: 20 @ 8/day -> "That's 2½ days", 23 -> "More than 2½ days".
 */
export function describeDays(lectures: number, lecturesPerDay: number): string | null {
  if (lecturesPerDay <= 0 || !Number.isFinite(lectures) || lectures * 2 < lecturesPerDay) return null;
  const halves = Math.floor((lectures * 2) / lecturesPerDay);
  const exact = (lectures * 2) % lecturesPerDay === 0;
  const whole = Math.floor(halves / 2);
  const half = halves % 2 === 1;
  const amount =
    whole === 0 ? "half a day" : `${whole}${half ? "½" : ""} ${whole === 1 && !half ? "day" : "days"}`;
  return `${exact ? "That's" : "More than"} ${amount}`;
}

/** Remaining lecture slots between now and the cutoff, derived from the real date. */
export function getHorizon(cal: AcademicCalendar, today: string, todayHeld: number): Horizon {
  const passed = today >= cal.cutoffDate;
  const days: Horizon["days"] = [];
  if (!passed) {
    if (isWorkingDay(today, cal)) {
      const remainingToday = Math.max(0, cal.lecturesPerDay - Math.max(0, todayHeld));
      if (remainingToday > 0) days.push({ date: today, lectures: remainingToday, isToday: true });
    }
    for (const d of upcomingWorkingDays(today, cal)) {
      days.push({ date: d, lectures: cal.lecturesPerDay, isToday: false });
    }
  }
  return {
    cutoffDate: cal.cutoffDate,
    cutoffLabel: cal.cutoffLabel,
    passed,
    days,
    lecturesLeft: days.reduce((a, d) => a + d.lectures, 0),
    workingDaysLeft: days.length,
  };
}

/** Integer-safe: lectures you can miss while staying >= target. */
export function safeSkips(present: number, held: number, target: number): number {
  if (target <= 0) return Number.MAX_SAFE_INTEGER;
  const slack = 100 * present - target * held;
  return slack >= 0 ? Math.floor(slack / target) : 0;
}

/** Integer-safe: consecutive lectures needed to climb back to target. */
export function lecturesNeeded(present: number, held: number, target: number): number {
  if (target >= 100) return 100 * present >= target * held ? 0 : Number.POSITIVE_INFINITY;
  const deficit = target * held - 100 * present;
  return deficit > 0 ? Math.ceil(deficit / (100 - target)) : 0;
}

export function computeMetrics(input: AttendanceInput, horizon: Horizon): AttendanceMetrics {
  const target = clampInt(input.targetPercentage, 50, 100, 75);
  const totalHeld = Math.max(0, input.baselineHeld) + Math.max(0, input.todayHeld);
  const totalPresent = Math.min(totalHeld, Math.max(0, input.baselinePresent) + Math.max(0, input.todayPresent));
  const percentage = pct(totalPresent, totalHeld);
  const isAboveTarget = totalHeld > 0 && 100 * totalPresent >= target * totalHeld;

  const safeBunks = isAboveTarget ? safeSkips(totalPresent, totalHeld, target) : 0;
  const classesNeeded = isAboveTarget ? 0 : lecturesNeeded(totalPresent, totalHeld, target);

  const L = horizon.lecturesLeft;
  const finalHeld = totalHeld + L;
  const requiredPresent = Math.ceil((target * finalHeld) / 100);
  const minToAttend = Math.max(0, requiredPresent - totalPresent);
  const canReachTarget = minToAttend <= L;

  let statusTier: AttendanceMetrics["statusTier"] = "safe";
  if (!isAboveTarget) statusTier = "critical";
  else if (percentage - target < 2) statusTier = "caution";

  return {
    totalHeld,
    totalPresent,
    percentage,
    targetPercentage: target,
    isAboveTarget,
    safeBunks,
    classesNeeded,
    statusTier,
    lecturesLeft: L,
    workingDaysLeft: horizon.workingDaysLeft,
    minToAttend: Math.min(minToAttend, L),
    canReachTarget,
    maxSkipsBeforeCutoff: canReachTarget ? L - minToAttend : 0,
    projectedIfAllAttended: pct(totalPresent + L, finalHeld),
  };
}

/** Projection at the cutoff for a day-by-day plan. Days marked off hold no lectures. */
export function projectPlan(metrics: AttendanceMetrics, horizon: Horizon, plan: PlanMap) {
  let held = 0;
  let attended = 0;
  let offDays = 0;
  for (const d of horizon.days) {
    const entry = plan[d.date];
    if (entry?.off) {
      offDays++;
      continue;
    }
    held += d.lectures;
    attended += clampInt(entry?.attend ?? d.lectures, 0, d.lectures);
  }
  const finalHeld = metrics.totalHeld + held;
  const finalPresent = metrics.totalPresent + attended;
  const finalPct = pct(finalPresent, finalHeld);
  return {
    held,
    attended,
    skipped: held - attended,
    offDays,
    finalHeld,
    finalPresent,
    finalPct,
    isEligible: finalHeld > 0 && 100 * finalPresent >= metrics.targetPercentage * finalHeld,
  };
}
