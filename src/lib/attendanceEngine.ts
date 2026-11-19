import { AttendanceMetrics, CalendarDayInfo } from "./types";
import { getGoofyQuote } from "./quotes";

export const CALENDAR_DAYS_UNTIL_MT2: CalendarDayInfo[] = [
  { dateStr: "19 Nov 2026", dayName: "Thursday (Today)", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "20 Nov 2026", dayName: "Friday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "21 Nov 2026", dayName: "Saturday", isWeekend: true, isHoliday: true, holidayReason: "Weekend Off", isExamDay: false, classesScheduled: 0 },
  { dateStr: "22 Nov 2026", dayName: "Sunday", isWeekend: true, isHoliday: true, holidayReason: "Weekend Off", isExamDay: false, classesScheduled: 0 },
  { dateStr: "23 Nov 2026", dayName: "Monday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "24 Nov 2026", dayName: "Tuesday", isWeekend: false, isHoliday: true, holidayReason: "College Holiday", isExamDay: false, classesScheduled: 0 },
  { dateStr: "25 Nov 2026", dayName: "Wednesday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "26 Nov 2026", dayName: "Thursday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "27 Nov 2026", dayName: "Friday", isWeekend: false, isHoliday: false, isExamDay: false, classesScheduled: 8 },
  { dateStr: "28 Nov 2026", dayName: "Saturday", isWeekend: true, isHoliday: true, holidayReason: "Prep Leave / Weekend", isExamDay: false, classesScheduled: 0 },
  { dateStr: "29 Nov 2026", dayName: "Sunday", isWeekend: true, isHoliday: true, holidayReason: "Prep Leave / Weekend", isExamDay: false, classesScheduled: 0 },
  { dateStr: "30 Nov 2026", dayName: "Monday", isWeekend: false, isHoliday: false, isExamDay: true, holidayReason: "MT2 Midterm Exams Start!", classesScheduled: 0 },
];

export function calculateAttendanceMetrics(
  totalHeldWed: number,
  presentWed: number,
  thursdayHeld: number,
  thursdayPresent: number,
  targetPercentage: number = 75,
  internalFactorBuffer: number = 16
): AttendanceMetrics {
  // Wednesday baseline
  const effectiveWedPresent = presentWed + internalFactorBuffer;
  const wednesdayPercentage = totalHeldWed > 0 ? (effectiveWedPresent / totalHeldWed) * 100 : 0;

  // Cumulative today (including Thursday)
  const currentTotalHeld = totalHeldWed + thursdayHeld;
  const currentAcademicPresent = presentWed + thursdayPresent;
  const currentEffectivePresent = currentAcademicPresent + internalFactorBuffer;
  const currentPercentage = currentTotalHeld > 0 ? (currentEffectivePresent / currentTotalHeld) * 100 : 0;

  // Target calculations
  const targetFraction = targetPercentage / 100;
  let safeBunksRemaining = 0;
  let classesNeededFor75 = 0;

  if (currentPercentage >= targetPercentage) {
    // How many classes can be missed in a row:
    // (currentEffectivePresent) / (currentTotalHeld + M) >= targetFraction
    // currentEffectivePresent >= targetFraction * currentTotalHeld + targetFraction * M
    // M <= (currentEffectivePresent - targetFraction * currentTotalHeld) / targetFraction
    const maxBunks = Math.floor((currentEffectivePresent - targetFraction * currentTotalHeld) / targetFraction);
    safeBunksRemaining = Math.max(0, maxBunks);
  } else {
    // Classes needed to reach target:
    // (currentEffectivePresent + X) / (currentTotalHeld + X) >= targetFraction
    // currentEffectivePresent + X >= targetFraction * currentTotalHeld + targetFraction * X
    // X * (1 - targetFraction) >= targetFraction * currentTotalHeld - currentEffectivePresent
    const needed = Math.ceil((targetFraction * currentTotalHeld - currentEffectivePresent) / (1 - targetFraction));
    classesNeededFor75 = Math.max(0, needed);
  }

  const safeDaysBunkable = Math.floor(safeBunksRemaining / 8);

  // MT2 Forecast calculations
  // Working days before MT2: Fri 20, Mon 23, Wed 25, Thu 26, Fri 27 (5 full days = 40 periods) + remaining lecs today (8 - thursdayHeld)
  const remainingToday = Math.max(0, 8 - thursdayHeld);
  const fullWorkingDaysUntilMT2 = 5;
  const totalLecturesUntilMT2 = remainingToday + fullWorkingDaysUntilMT2 * 8;

  // If total held by MT2 will be: currentTotalHeld + totalLecturesUntilMT2
  // We need total effective present by MT2 >= targetFraction * (currentTotalHeld + totalLecturesUntilMT2)
  // currentEffectivePresent + AttendedUntilMT2 >= targetFraction * (finalTotal)
  const finalTotalLectures = currentTotalHeld + totalLecturesUntilMT2;
  const requiredEffectivePresent = Math.ceil(targetFraction * finalTotalLectures);
  const minClassesToAttendBeforeMT2 = Math.max(0, requiredEffectivePresent - currentEffectivePresent);

  const { quote, tier } = getGoofyQuote(currentPercentage);

  return {
    wednesdayHeld: totalHeldWed,
    wednesdayPresent: presentWed,
    wednesdayPercentage: Number(wednesdayPercentage.toFixed(2)),

    thursdayHeld,
    thursdayPresent,

    currentTotalHeld,
    currentTotalPresent: currentEffectivePresent,
    currentPercentage: Number(currentPercentage.toFixed(2)),

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
