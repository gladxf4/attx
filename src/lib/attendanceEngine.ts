import { AttendanceMetrics, CalendarDayInfo } from "./types";

export const CALENDAR_DAYS_UNTIL_MT2: CalendarDayInfo[] = [
  { dateStr: "19 Nov", dayName: "Thu (Today)", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "20 Nov", dayName: "Friday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "21 Nov", dayName: "Saturday", isWeekend: true, isHoliday: true, holidayReason: "Weekend", isExamDay: false, classesScheduled: 0 },
  { dateStr: "22 Nov", dayName: "Sunday", isWeekend: true, isHoliday: true, holidayReason: "Weekend", isExamDay: false, classesScheduled: 0 },
  { dateStr: "23 Nov", dayName: "Monday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "24 Nov", dayName: "Tuesday", isWeekend: false, isHoliday: true, holidayReason: "Holiday (Martyrdom Day)", isExamDay: false, classesScheduled: 0 },
  { dateStr: "25 Nov", dayName: "Wednesday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "26 Nov", dayName: "Thursday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "27 Nov", dayName: "Friday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "28 Nov", dayName: "Saturday", isWeekend: true, isHoliday: true, holidayReason: "Weekend", isExamDay: false, classesScheduled: 0 },
  { dateStr: "29 Nov", dayName: "Sunday", isWeekend: true, isHoliday: true, holidayReason: "Weekend", isExamDay: false, classesScheduled: 0 },
  { dateStr: "30 Nov", dayName: "Monday", isWeekend: false, isHoliday: false, isExamDay: true, holidayReason: "MT2 Starts", classesScheduled: 0 },
];

export const WORKING_DAYS_SCHEDULE = CALENDAR_DAYS_UNTIL_MT2;

export function getRelativeDateText(targetDateStr: string = "2026-11-18"): string {
  try {
    const today = new Date(2026, 10, 19);
    const base = new Date(2026, 10, 18);
    const diffTime = today.getTime() - base.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) return "Yesterday";
    if (diffDays === 0) return "Today";
    if (diffDays > 1) return `${diffDays} days ago`;
    return "18 Nov";
  } catch {
    return "18 Nov";
  }
}

export function getDynamicBaselineInfo() {
  return {
    anchorDateStr: "Wed, 18 Nov",
    anchorHeldAIML: 421,
    anchorPresentAIML: 316,
    anchorOfficialPctAIML: 78.86,
    currentDateStr: "Thu, 19 Nov",
    yesterdayDateStr: "Yesterday (18 Nov)",
    expectedBaselineHeldAIML: 421,
    erpNoticeText:
      "ERP records only reflect the latest submissions uploaded by faculty, which may not yet include today’s lectures. Mark today's periods separately below to project your real-time standing.",
  };
}

export function calculateAttendanceMetrics(
  totalHeldWed: number,
  presentWed: number,
  thursdayHeld: number = 0,
  thursdayPresent: number = 0,
  targetPercentage: number = 75,
  internalFactorBuffer: number = 0,
  officialBaselinePercentage?: number
): AttendanceMetrics {
  const relativeText = getRelativeDateText("2026-11-18");

  // Calibrate buffer dynamically if official percentage is supplied
  let effectiveBuffer = Math.max(0, internalFactorBuffer || 0);
  if (officialBaselinePercentage !== undefined && officialBaselinePercentage > 0 && totalHeldWed > 0) {
    const targetOfficialPresent = Math.round((officialBaselinePercentage / 100) * totalHeldWed);
    effectiveBuffer = Math.max(0, targetOfficialPresent - presentWed);
  }

  // Baseline
  const effectiveWedPresent = presentWed + effectiveBuffer;
  const wednesdayPercentage = totalHeldWed > 0 ? (effectiveWedPresent / totalHeldWed) * 100 : 0;

  // Cumulative current status (including today's tracked periods)
  const clampedTodayHeld = Math.max(0, Math.min(8, thursdayHeld));
  const clampedTodayPresent = Math.max(0, Math.min(clampedTodayHeld, thursdayPresent));

  const currentTotalHeld = totalHeldWed + clampedTodayHeld;
  const currentAcademicPresent = presentWed + clampedTodayPresent;
  const currentEffectivePresent = currentAcademicPresent + effectiveBuffer;

  // Raw academic table %
  const rawPercentage = currentTotalHeld > 0 ? (currentAcademicPresent / currentTotalHeld) * 100 : 0;

  // Official consolidated attendance %
  const currentPercentage = currentTotalHeld > 0 ? (currentEffectivePresent / currentTotalHeld) * 100 : 0;

  // Target calculations based on targetPercentage
  const targetFraction = targetPercentage / 100;
  let safeBunksRemaining = 0;
  let classesNeededFor75 = 0;

  if (currentPercentage >= targetPercentage) {
    const maxBunks = Math.floor((currentEffectivePresent - targetFraction * currentTotalHeld) / targetFraction);
    safeBunksRemaining = Math.max(0, maxBunks);
  } else {
    const needed = Math.ceil((targetFraction * currentTotalHeld - currentEffectivePresent) / (1 - targetFraction));
    classesNeededFor75 = Math.max(0, needed);
  }

  const safeDaysBunkable = Math.floor(safeBunksRemaining / 8);

  const remainingToday = Math.max(0, 8 - clampedTodayHeld);
  const fullWorkingDaysUntilMT2 = 5; // Fri 20, Mon 23, Wed 25, Thu 26, Fri 27 (Nov 24 holiday, Nov 30 exam)
  const totalLecturesUntilMT2 = remainingToday + fullWorkingDaysUntilMT2 * 8;

  const finalTotalLectures = currentTotalHeld + totalLecturesUntilMT2;
  const requiredEffectivePresent = Math.ceil(targetFraction * finalTotalLectures);
  const minClassesToAttendBeforeMT2 = Math.max(0, requiredEffectivePresent - currentEffectivePresent);

  let statusTier: "safe" | "caution" | "critical" = "safe";
  if (currentPercentage < targetPercentage) {
    statusTier = "critical";
  } else if (currentPercentage - targetPercentage < 2.0) {
    statusTier = "caution";
  }

  return {
    wednesdayHeld: totalHeldWed,
    wednesdayPresent: presentWed,
    wednesdayPercentage: Number(wednesdayPercentage.toFixed(2)),
    baselineDateStr: "18 Nov 2026",
    baselineRelativeText: relativeText,

    thursdayHeld: clampedTodayHeld,
    thursdayPresent: clampedTodayPresent,

    currentTotalHeld,
    currentTotalPresent: currentEffectivePresent,
    currentPercentage: Number(currentPercentage.toFixed(2)),
    rawPercentage: Number(rawPercentage.toFixed(2)),
    concessionBuffer: effectiveBuffer,

    targetPercentage,
    isEligibleForMT2: currentPercentage >= targetPercentage,
    safeBunksRemaining,
    safeDaysBunkable,
    classesNeededFor75,

    workingDaysUntilMT2: fullWorkingDaysUntilMT2 + (remainingToday > 0 ? 1 : 0),
    totalLecturesUntilMT2,
    minClassesToAttendBeforeMT2,

    statusTier,
    hasERPInitialized: totalHeldWed > 0,
  };
}
