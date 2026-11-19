import { addDays, isValidISO, weekday } from "./dates";

export interface AcademicCalendar {
  /** First day of the exam window. Attendance is evaluated on lectures held before it. */
  cutoffDate: string;
  cutoffLabel: string;
  lecturesPerDay: number;
  /** 0 = Sunday ... 6 = Saturday */
  weekendDays: number[];
  holidays: Record<string, string>;
}

/**
 * College-wide calendar defaults. Students can override the cutoff and
 * lectures/day from Settings; everything else is derived from the real date.
 */
export const DEFAULT_CALENDAR: AcademicCalendar = {
  cutoffDate: "2026-11-30",
  cutoffLabel: "MT2",
  lecturesPerDay: 8,
  weekendDays: [0, 6],
  holidays: {
    "2026-11-24": "Guru Tegh Bahadur Martyrdom Day",
    "2026-12-25": "Christmas",
  },
};

export interface CalendarPrefs {
  cutoffDate?: string;
  cutoffLabel?: string;
  lecturesPerDay?: number;
}

export function resolveCalendar(prefs?: CalendarPrefs | null): AcademicCalendar {
  const cal = { ...DEFAULT_CALENDAR };
  if (prefs?.cutoffDate && isValidISO(prefs.cutoffDate)) cal.cutoffDate = prefs.cutoffDate;
  if (prefs?.cutoffLabel && prefs.cutoffLabel.trim()) cal.cutoffLabel = prefs.cutoffLabel.trim().slice(0, 24);
  if (prefs?.lecturesPerDay && prefs.lecturesPerDay >= 1 && prefs.lecturesPerDay <= 12) {
    cal.lecturesPerDay = Math.round(prefs.lecturesPerDay);
  }
  return cal;
}

export function holidayReason(iso: string, cal: AcademicCalendar): string | undefined {
  if (cal.holidays[iso]) return cal.holidays[iso];
  if (cal.weekendDays.includes(weekday(iso))) return "Weekend";
  return undefined;
}

export function isWorkingDay(iso: string, cal: AcademicCalendar): boolean {
  return !holidayReason(iso, cal) && iso < cal.cutoffDate;
}

/** Working days strictly after `fromISO` and strictly before the cutoff. */
export function upcomingWorkingDays(fromISO: string, cal: AcademicCalendar): string[] {
  const out: string[] = [];
  let d = addDays(fromISO, 1);
  // hard stop to avoid runaway loops on bad config
  for (let i = 0; i < 400 && d < cal.cutoffDate; i++, d = addDays(d, 1)) {
    if (isWorkingDay(d, cal)) out.push(d);
  }
  return out;
}
