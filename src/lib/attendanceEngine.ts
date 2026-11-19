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

export function calculateAttendanceMetrics(
  totalHeldWed: number,
  presentWed: number,
  thursdayHeld: number,
  thursdayPresent: number,
  targetPercentage: number = 75,
  internalFactorBuffer: number = 16
): AttendanceMetrics {
  const effectiveWedPresent = presentWed + internalFactorBuffer;
  const wednesdayPercentage = totalHeldWed > 0 ? (effectiveWedPresent / totalHeldWed) * 100 : 0;

  const currentTotalHeld = totalHeldWed + thursdayHeld;
  const currentAcademicPresent = presentWed + thursdayPresent;
  const currentEffectivePresent = currentAcademicPresent + internalFactorBuffer;
  const currentPercentage = currentTotalHeld > 0 ? (currentEffectivePresent / currentTotalHeld) * 100 : 0;

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
