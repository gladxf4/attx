import { AcademicCalendar, holidayReason } from "./academicCalendar";
import { addDays, weekday } from "./dates";
import { DatewiseMap, DatewiseSubjectLog, PlanMap, SubjectRecord } from "./types";

export interface PeriodEntry {
  code: string;
  name: string;
  isLab: boolean;
  held: number;
  present: number;
  source: "erp" | "manual" | "expected";
}

export interface DayInfo {
  date: string;
  kind: "past" | "today" | "future";
  isWorking: boolean;
  isCutoff: boolean;
  afterCutoff: boolean;
  closedReason?: string;
  periods: PeriodEntry[];
  held: number;
  present: number;
  hasRecords: boolean;
  /** Planned attendance for upcoming working days */
  plan?: { attend: number; lectures: number; off: boolean };
}

export function getErpDay(datewise: DatewiseMap | undefined, date: string): DatewiseSubjectLog[] {
  const list = datewise?.[date];
  return Array.isArray(list) ? list : [];
}

export function sumLogs(logs: DatewiseSubjectLog[]) {
  let held = 0;
  let present = 0;
  for (const l of logs) {
    const h = Math.max(0, Number(l.held) || 1);
    held += h;
    present += l.present !== undefined ? Math.max(0, Math.min(h, Number(l.present) || 0)) : l.status === "P" ? h : 0;
  }
  return { held, present };
}

function toPeriods(logs: DatewiseSubjectLog[], source: PeriodEntry["source"]): PeriodEntry[] {
  return logs.map((l) => ({
    code: l.code,
    name: l.name,
    isLab: !!l.isLab,
    held: Math.max(1, Number(l.held) || 1),
    present: source === "expected" ? Math.max(1, Number(l.held) || 1) : Math.max(0, Number(l.present) || 0),
    source,
  }));
}

/** Guesses a future day's timetable from the latest recorded day with the same weekday. */
export function inferTimetable(datewise: DatewiseMap, date: string, today: string): PeriodEntry[] {
  const wd = weekday(date);
  let d = addDays(today, -1);
  for (let i = 0; i < 35; i++, d = addDays(d, -1)) {
    if (weekday(d) !== wd) continue;
    const logs = getErpDay(datewise, d);
    if (logs.length > 0) return toPeriods(logs, "expected");
  }
  return [];
}

export function buildDay(
  date: string,
  ctx: {
    today: string;
    cal: AcademicCalendar;
    datewise: DatewiseMap;
    subjects: SubjectRecord[];
    plan: PlanMap;
    todayTotals?: { held: number; present: number };
  }
): DayInfo {
  const { today, cal, datewise, subjects, plan } = ctx;
  const kind: DayInfo["kind"] = date < today ? "past" : date === today ? "today" : "future";
  const closedReason = holidayReason(date, cal);
  const isCutoff = date === cal.cutoffDate;
  const afterCutoff = date > cal.cutoffDate;
  const isWorking = !closedReason && !isCutoff && !afterCutoff;

  let periods: PeriodEntry[] = [];
  const erp = getErpDay(datewise, date);

  if (kind === "past") {
    periods = toPeriods(erp, "erp");
  } else if (kind === "today") {
    periods = toPeriods(erp, "erp");
    for (const s of subjects) {
      const h = s.todayHeld || 0;
      if (h > 0) {
        periods.push({ code: s.code, name: s.name, isLab: !!s.isLab, held: h, present: s.todayPresent || 0, source: "manual" });
      }
    }
  } else if (isWorking) {
    periods = inferTimetable(datewise, date, today);
  }

  let held = periods.filter((p) => p.source !== "expected").reduce((a, p) => a + p.held, 0);
  let present = periods.filter((p) => p.source !== "expected").reduce((a, p) => a + p.present, 0);
  if (kind === "today" && ctx.todayTotals) {
    held = ctx.todayTotals.held;
    present = ctx.todayTotals.present;
  }

  let planInfo: DayInfo["plan"];
  if (kind === "future" && isWorking) {
    const entry = plan[date];
    planInfo = {
      lectures: cal.lecturesPerDay,
      attend: entry?.attend ?? cal.lecturesPerDay,
      off: !!entry?.off,
    };
  }

  return {
    date,
    kind,
    isWorking,
    isCutoff,
    afterCutoff,
    closedReason: isCutoff ? `${cal.cutoffLabel} begins` : closedReason,
    periods,
    held,
    present,
    hasRecords: held > 0,
    plan: planInfo,
  };
}
