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
  internalFactorBuffer: number = 16
): AttendanceMetrics {
  const relativeText = getRelativeDateText("2026-11-18");

  // Wednesday baseline (higher %)
  const effectiveWedPresent = presentWed + internalFactorBuffer;
  const wednesdayPercentage = totalHeldWed > 0 ? (effectiveWedPresent / totalHeldWed) * 100 : 0;

  // Cumulative current status (including today)
  const currentTotalHeld = totalHeldWed + thursdayHeld;
  const currentAcademicPresent = presentWed + thursdayPresent;
  const currentEffectivePresent = currentAcademicPresent + internalFactorBuffer;

  // Lower % (Raw academic table on ERP)
  const rawPercentage = currentTotalHeld > 0 ? (currentAcademicPresent / currentTotalHeld) * 100 : 0;

  // Higher % (Official attendance considered by college)
  const currentPercentage = currentTotalHeld > 0 ? (currentEffectivePresent / currentTotalHeld) * 100 : 0;

  // Target calculations based on the higher % (since college considers higher %)
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
    concessionBuffer: internalFactorBuffer,

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
