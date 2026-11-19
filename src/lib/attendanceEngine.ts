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

export function isLabSubject(code?: string, name?: string): boolean {
  const c = (code || "").trim();
  const n = (name || "").toLowerCase().trim();

  // 1. Subject code rules: ABES practical codes contain '5' in the last 2 digits (e.g. 25CS352 vs 25CS302)
  if (/\d{2}[A-Za-z]{2,4}\d5\d/i.test(c)) return true;
  if (/5\d$/.test(c)) return true;
  if (/L$/i.test(c)) return true;

  // 2. Name keywords: labs, workshops, practicals, cloud, web dev, employability, holistic skill
  if (
    n.includes("lab") ||
    n.includes("workshop") ||
    n.includes("cloud") ||
    n.includes("web dev") ||
    n.includes("web design") ||
    n.includes("employability") ||
    n.includes("practical") ||
    n.includes("oops lab") ||
    n.includes("os lab") ||
    n.includes("holistic") ||
    n.includes("skill")
  ) {
    return true;
  }

  return false;
}

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

export interface DynamicMT2Horizon {
  remainingWorkingDaysCount: number;
  upcomingDates: { dateStr: string; dayNumber: number; dayName: string; dayShort: string; classesScheduled: number }[];
  totalLecturesRemaining: number;
}

export function getDynamicMT2Horizon(currentDate: Date = new Date()): DynamicMT2Horizon {
  const masterWorkingSchedule = [
    { dateStr: "2026-11-20", dayNumber: 20, dayName: "Friday", dayShort: "Fri", classesScheduled: 8 },
    { dateStr: "2026-11-23", dayNumber: 23, dayName: "Monday", dayShort: "Mon", classesScheduled: 8 },
    { dateStr: "2026-11-25", dayNumber: 25, dayName: "Wednesday", dayShort: "Wed", classesScheduled: 8 },
    { dateStr: "2026-11-26", dayNumber: 26, dayName: "Thursday", dayShort: "Thu", classesScheduled: 8 },
    { dateStr: "2026-11-27", dayNumber: 27, dayName: "Friday", dayShort: "Fri", classesScheduled: 8 },
  ];

  let dayNum = 19;
  if (currentDate.getFullYear() === 2026 && currentDate.getMonth() === 10) {
    dayNum = currentDate.getDate();
  }

  const upcoming = masterWorkingSchedule.filter((d) => d.dayNumber > dayNum);
  const remainingWorkingDaysCount = upcoming.length;
  const totalLecturesRemaining = remainingWorkingDaysCount * 8;

  return {
    remainingWorkingDaysCount,
    upcomingDates: upcoming,
    totalLecturesRemaining,
  };
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
  const { remainingWorkingDaysCount, totalLecturesRemaining } = getDynamicMT2Horizon();
  const totalLecturesUntilMT2 = remainingToday + totalLecturesRemaining;

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

    workingDaysUntilMT2: remainingWorkingDaysCount + (remainingToday > 0 ? 1 : 0),
    totalLecturesUntilMT2,
    minClassesToAttendBeforeMT2,

    statusTier,
    hasERPInitialized: totalHeldWed > 0,
  };
}
