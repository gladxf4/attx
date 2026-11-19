import { AttendanceMetrics, CalendarDayInfo } from "./types";
import { getGoofyQuote } from "./quotes";

export const CALENDAR_DAYS_UNTIL_MT2: CalendarDayInfo[] = [
  { dateStr: "19 Nov", dayName: "Thu (Today)", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "20 Nov", dayName: "Friday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "21 Nov", dayName: "Saturday", isWeekend: true, isHoliday: true, holidayReason: "Weekend", isExamDay: false, classesScheduled: 0 },
  { dateStr: "22 Nov", dayName: "Sunday", isWeekend: true, isHoliday: true, holidayReason: "Weekend", isExamDay: false, classesScheduled: 0 },
  { dateStr: "23 Nov", dayName: "Monday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "24 Nov", dayName: "Tuesday", isWeekend: false, isHoliday: true, holidayReason: "Holiday", isExamDay: false, classesScheduled: 0 },
  { dateStr: "25 Nov", dayName: "Wednesday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "26 Nov", dayName: "Thursday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "27 Nov", dayName: "Friday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "28 Nov", dayName: "Saturday", isWeekend: true, isHoliday: true, holidayReason: "Weekend", isExamDay: false, classesScheduled: 0 },
  { dateStr: "29 Nov", dayName: "Sunday", isWeekend: true, isHoliday: true, holidayReason: "Weekend", isExamDay: false, classesScheduled: 0 },
  { dateStr: "30 Nov", dayName: "Monday", isWeekend: false, isHoliday: false, isExamDay: true, holidayReason: "MT2 Starts", classesScheduled: 0 },
];

export interface DynamicBaselineInfo {
  anchorDateStr: string;
  anchorHeldAIML: number;
  anchorPresentAIML: number;
  anchorOfficialPctAIML: number;
  currentDateStr: string;
  yesterdayDateStr: string;
  expectedBaselineHeldAIML: number;
  erpNoticeText: string;
}

export function getDynamicBaselineInfo(currentDate: Date = new Date()): DynamicBaselineInfo {
  // Anchored on Wed 18 Nov 2026
  const now = new Date(currentDate.getTime());

  // Daily schedule map for 2026 odd semester
  const scheduleMap: Record<string, number> = {
    "2026-11-19": 8, // Thu
    "2026-11-20": 8, // Fri
    "2026-11-21": 0, // Sat (Weekend)
    "2026-11-22": 0, // Sun (Weekend)
    "2026-11-23": 8, // Mon
    "2026-11-24": 0, // Tue (Holiday)
    "2026-11-25": 8, // Wed
    "2026-11-26": 8, // Thu
    "2026-11-27": 8, // Fri
    "2026-11-28": 0, // Sat (Weekend)
    "2026-11-29": 0, // Sun (Weekend)
    "2026-11-30": 0, // Mon (MT2 Starts)
  };

  // Determine yesterday/last working day
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const yesterdayStr = `${dayNames[yesterday.getDay()]}, ${yesterday.getDate()} ${monthNames[yesterday.getMonth()]}`;
  const currentStr = `${dayNames[now.getDay()]}, ${now.getDate()} ${monthNames[now.getMonth()]}`;

  // Calculate accumulated lectures held up to yesterday
  let accumulatedAIMLHeld = 421;
  const runner = new Date(2026, 10, 19);
  while (runner < now && runner.getDate() !== now.getDate()) {
    const key = `2026-${String(runner.getMonth() + 1).padStart(2, "0")}-${String(runner.getDate()).padStart(2, "0")}`;
    accumulatedAIMLHeld += (scheduleMap[key] || 0);
    runner.setDate(runner.getDate() + 1);
  }

  return {
    anchorDateStr: "Wed, 18 Nov",
    anchorHeldAIML: 421,
    anchorPresentAIML: 316,
    anchorOfficialPctAIML: 78.86,
    currentDateStr: currentStr,
    yesterdayDateStr: `Yesterday (${yesterdayStr})`,
    expectedBaselineHeldAIML: accumulatedAIMLHeld,
    erpNoticeText:
      "The ERP portal only displays the latest recorded attendance, which may not yet include today’s classes (depending on individual faculty upload timing). Enter your baseline counts up to yesterday, then track today's periods separately below.",
  };
}

export function getRelativeDateText(targetDateStr: string = "2026-11-18"): string {
  try {
    const today = new Date(2026, 10, 19); // 19 Nov 2026
    const base = new Date(2026, 10, 18); // 18 Nov 2026
    const diffTime = today.getTime() - base.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) return "Yesterday (18 Nov)";
    if (diffDays === 0) return "Today";
    if (diffDays > 1) return `${diffDays} days ago (18 Nov)`;
    return "Wednesday, 18 Nov";
  } catch {
    return "Wednesday, 18 Nov";
  }
}

export function calculateAttendanceMetrics(
  totalHeldWed: number,
  presentWed: number,
  thursdayHeld: number = 8,
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

  // Wednesday baseline
  const effectiveWedPresent = presentWed + effectiveBuffer;
  const wednesdayPercentage = totalHeldWed > 0 ? (effectiveWedPresent / totalHeldWed) * 100 : 0;

  // Cumulative current status (including today)
  const currentTotalHeld = totalHeldWed + thursdayHeld;
  const currentAcademicPresent = presentWed + thursdayPresent;
  const currentEffectivePresent = currentAcademicPresent + effectiveBuffer;

  // Raw academic table % on ERP (from Total row)
  const rawPercentage = currentTotalHeld > 0 ? (currentAcademicPresent / currentTotalHeld) * 100 : 0;

  // Official attendance % (shown at bottom of ERP page, considered for exam eligibility)
  const currentPercentage = currentTotalHeld > 0 ? (currentEffectivePresent / currentTotalHeld) * 100 : 0;

  // Target calculations based on the official bottom % (since college considers this for eligibility)
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

  const remainingToday = Math.max(0, 8 - thursdayHeld);
  const fullWorkingDaysUntilMT2 = 5;
  const totalLecturesUntilMT2 = remainingToday + fullWorkingDaysUntilMT2 * 8;

  const finalTotalLectures = currentTotalHeld + totalLecturesUntilMT2;
  const requiredEffectivePresent = Math.ceil(targetFraction * finalTotalLectures);
  const minClassesToAttendBeforeMT2 = Math.max(0, requiredEffectivePresent - currentEffectivePresent);

  const { quote, tier } = getGoofyQuote(currentPercentage);

  return {
    wednesdayHeld: totalHeldWed,
    wednesdayPresent: presentWed,
    wednesdayPercentage: Number(wednesdayPercentage.toFixed(2)),
    baselineDateStr: "18 Nov 2026",
    baselineRelativeText: relativeText,

    thursdayHeld,
    thursdayPresent,

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

    goofyQuote: quote,
    statusTier: tier,
  };
}
