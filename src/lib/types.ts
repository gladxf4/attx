export interface SubjectRecord {
  code: string;
  name: string;
  held: number;
  pres: number;
  abs: number;
  pct: number;
  needed75: number;
  isLab?: boolean;
  todayHeld?: number;
  todayPresent?: number;
}

export interface DatewiseSubjectLog {
  code: string;
  name: string;
  held: number;
  present: number;
  status: "P" | "A";
  isLab?: boolean;
}

export interface DayAttendanceLog {
  dateStr: string; // "2026-11-19"
  displayDate: string; // "19 Nov"
  dayNumber: number; // 19
  dayName: string; // "Thursday"
  dayShort: string; // "Thu"
  isWeekend: boolean;
  isHoliday: boolean;
  holidayReason?: string;
  isToday: boolean;
  isFuture: boolean;
  isExamDay: boolean;
  totalHeld: number;
  totalPresent: number;
  records: DatewiseSubjectLog[];
  isVerifiedERP?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  name?: string;
  branch?: string;
  sem?: string;
  totalHeld: number;
  academicPresent: number;
  officialPercentage?: number;
  thursdayHeld: number;
  thursdayPresent: number;
  targetPercentage: number;
  custom_subjects?: SubjectRecord[];
}

export interface AttendanceMetrics {
  // Baseline / ERP Counts
  wednesdayHeld: number;
  wednesdayPresent: number;
  wednesdayPercentage: number;
  baselineDateStr: string;
  baselineRelativeText: string;

  // Today's classes
  thursdayHeld: number;
  thursdayPresent: number;

  // Cumulative status
  currentTotalHeld: number;
  currentTotalPresent: number;
  currentPercentage: number; // Official consolidated %
  rawPercentage: number; // Subject table raw %
  concessionBuffer: number;

  // Target & Bunking Metrics
  targetPercentage: number;
  isEligibleForMT2: boolean;
  safeBunksRemaining: number;
  safeDaysBunkable: number;
  classesNeededFor75: number;

  // MT2 Horizon (Exams begin Nov 30)
  workingDaysUntilMT2: number;
  totalLecturesUntilMT2: number;
  minClassesToAttendBeforeMT2: number;

  statusTier: "safe" | "caution" | "critical";
  hasERPInitialized?: boolean;
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
