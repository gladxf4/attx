export interface SubjectRecord {
  code: string;
  name: string;
  held: number;
  pres: number;
  abs: number;
  pct: number;
  needed75: number;
  isLab?: boolean;
  /** Periods the student marked manually today (not yet on ERP) */
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

export type DatewiseMap = Record<string, DatewiseSubjectLog[]>;

export interface SessionUser {
  id: string;
  username: string;
  name?: string;
}

/**
 * The only attendance numbers the client keeps. `baselinePresent` is already the
 * official count (whatever the ERP credits), so nothing downstream needs to know
 * how it was derived.
 */
export interface AttendanceInput {
  baselineHeld: number;
  baselinePresent: number;
  todayHeld: number;
  todayPresent: number;
  targetPercentage: number;
}

export interface HorizonDay {
  date: string;
  lectures: number;
  isToday: boolean;
}

export interface Horizon {
  cutoffDate: string;
  cutoffLabel: string;
  passed: boolean;
  days: HorizonDay[];
  lecturesLeft: number;
  workingDaysLeft: number;
}

export interface AttendanceMetrics {
  totalHeld: number;
  totalPresent: number;
  percentage: number;
  targetPercentage: number;
  isAboveTarget: boolean;
  safeBunks: number;
  classesNeeded: number;
  statusTier: "safe" | "caution" | "critical";

  lecturesLeft: number;
  workingDaysLeft: number;
  minToAttend: number;
  canReachTarget: boolean;
  maxSkipsBeforeCutoff: number;
  projectedIfAllAttended: number;
}

export interface PlanEntry {
  attend: number;
  off?: boolean;
}
export type PlanMap = Record<string, PlanEntry>;
