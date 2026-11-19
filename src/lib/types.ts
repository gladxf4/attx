export interface UserProfile {
  id: string;
  username: string;
  name: string;
  branch: string;
  sem: string;
  totalHeld: number; // As of Wednesday 18 Nov default
  academicPresent: number; // As of Wednesday 18 Nov default
  thursdayHeld: number; // Thursday 19 Nov
  thursdayPresent: number; // Thursday 19 Nov
  targetPercentage: number;
}

export interface AttendanceMetrics {
  // Wednesday baseline
  wednesdayHeld: number;
  wednesdayPresent: number;
  wednesdayPercentage: number;

  // Thursday status
  thursdayHeld: number;
  thursdayPresent: number;

  // Cumulative current status (including Thursday)
  currentTotalHeld: number;
  currentTotalPresent: number;
  currentPercentage: number;

  // Target & Bunking Metrics
  targetPercentage: number;
  isEligibleForMT2: boolean;
  safeBunksRemaining: number;
  safeDaysBunkable: number;
  classesNeededFor75: number;

  // MT2 Specific Forecast (Exams start Nov 30)
  workingDaysUntilMT2: number;
  totalLecturesUntilMT2: number;
  minClassesToAttendBeforeMT2: number;

  // Humor & Status
  goofyQuote: string;
  statusTier: "god" | "safe" | "borderline" | "critical";
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
