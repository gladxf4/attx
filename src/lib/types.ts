export interface UserProfile {
  id: string;
  username: string;
  name?: string;
  branch?: string;
  sem?: string;
  totalHeld: number; // Previous day baseline
  academicPresent: number; // Previous day baseline
  officialPercentage?: number; // Official ERP % (e.g. 79.01)
  thursdayHeld: number; // Today
  thursdayPresent: number; // Today
  targetPercentage: number;
}

export interface AttendanceMetrics {
  // Baseline (e.g. Wednesday 18 Nov)
  wednesdayHeld: number;
  wednesdayPresent: number;
  wednesdayPercentage: number;
  baselineDateStr: string;
  baselineRelativeText: string;

  // Today (e.g. Thursday 19 Nov)
  thursdayHeld: number;
  thursdayPresent: number;

  // Cumulative current status (including Today)
  currentTotalHeld: number;
  currentTotalPresent: number;
  currentPercentage: number; // Official % (shown at bottom of ERP page, used for exam eligibility)
  rawPercentage: number; // Raw table % (calculated from subject lectures row)
  concessionBuffer: number;

  // Target & Bunking Metrics
  targetPercentage: number;
  isEligibleForMT2: boolean;
  safeBunksRemaining: number;
  safeDaysBunkable: number;
  classesNeededFor75: number;

  // MT2 Forecast (Exams start Nov 30)
  workingDaysUntilMT2: number;
  totalLecturesUntilMT2: number;
  minClassesToAttendBeforeMT2: number;

  // Status & Note
  goofyQuote: string;
  statusTier: "safe" | "caution" | "critical";
}

export interface CalendarDayInfo {
  dateStr: string;
  dayName: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayReason?: string;
  isExamDay: boolean;
  classesScheduled: number;
}
