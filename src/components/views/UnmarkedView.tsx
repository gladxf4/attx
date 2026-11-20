"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  RotateCcw,
  Sparkles,
  UserCheck,
  UserX,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { AttendanceMetrics, DatewiseMap } from "@/lib/types";
import {
  AIML_3A_PRESET,
  DayReconciliation,
  reconcileDay,
  ReconciledPeriod,
} from "@/lib/timetablePresets";

interface Props {
  metrics: AttendanceMetrics;
  today: string;
  datewise: DatewiseMap;
  lecturesPerDay: number;
  onConnectErp?: () => void;
}

const WEEK_DATES = [
  { date: "2026-11-16", weekday: "Monday", label: "Mon", full: "16 Nov" },
  { date: "2026-11-17", weekday: "Tuesday", label: "Tue", full: "17 Nov" },
  { date: "2026-11-18", weekday: "Wednesday", label: "Wed", full: "18 Nov" },
  { date: "2026-11-19", weekday: "Thursday", label: "Thu", full: "19 Nov" },
  { date: "2026-11-20", weekday: "Friday", label: "Fri", full: "20 Nov (Today)" },
];

export function UnmarkedView({ metrics, today, datewise, lecturesPerDay }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(today);
  // User's interactive marks for unmarked periods: periodKey -> "P" | "A"
  const [userMarks, setUserMarks] = useState<Record<string, "P" | "A">>({});

  // Reconcile each day of the week
  const weekReconciliations = useMemo(() => {
    const map = new Map<string, DayReconciliation>();
    for (const d of WEEK_DATES) {
      const logs = datewise[d.date] || [];
      const rec = reconcileDay(d.date, d.weekday, logs);
      map.set(d.date, rec);
    }
    return map;
  }, [datewise]);

  const activeDay = weekReconciliations.get(selectedDate) || weekReconciliations.get("2026-11-20")!;

  // Collect all unmarked periods across the week
  const allUnmarkedPeriods = useMemo(() => {
    const list: { date: string; weekday: string; period: ReconciledPeriod }[] = [];
    for (const d of WEEK_DATES) {
      const rec = weekReconciliations.get(d.date);
      if (rec) {
        rec.periods
          .filter((p) => p.status === "unmarked")
          .forEach((period) => list.push({ date: d.date, weekday: d.weekday, period }));
      }
    }
    return list;
  }, [weekReconciliations]);

  // Compute live simulated metrics based on unmarked classes marked by student
  const simulation = useMemo(() => {
    let addedHeld = 0;
    let addedPresent = 0;

    for (const item of allUnmarkedPeriods) {
      const mark = userMarks[item.period.periodKey];
      if (mark === "P") {
        addedHeld += item.period.held;
        addedPresent += item.period.held;
      } else if (mark === "A") {
        addedHeld += item.period.held;
      }
    }

    const baselineHeld = metrics.totalHeld;
    const baselinePresent = metrics.totalPresent;
    const simHeld = baselineHeld + addedHeld;
    const simPresent = baselinePresent + addedPresent;
    const simPct = simHeld > 0 ? (simPresent / simHeld) * 100 : 0;
    const diffPct = simPct - metrics.percentage;

    return {
      addedHeld,
      addedPresent,
      simHeld,
      simPresent,
      simPct,
      diffPct,
    };
  }, [allUnmarkedPeriods, userMarks, metrics]);

  const markAll = (status: "P" | "A") => {
    const next: Record<string, "P" | "A"> = {};
    for (const item of allUnmarkedPeriods) {
      next[item.period.periodKey] = status;
    }
    setUserMarks(next);
  };

  const resetMarks = () => setUserMarks({});

  const togglePeriodMark = (periodKey: string, status: "P" | "A") => {
    setUserMarks((prev) => {
      const copy = { ...prev };
      if (copy[periodKey] === status) {
        delete copy[periodKey]; // toggle off
      } else {
        copy[periodKey] = status;
      }
      return copy;
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Section Context */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="chip chip-brand">AIML-3A Preset</span>
            <span className="text-xs text-zinc-500">KC 501 • Odd Sem 2026-27</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Unmarked & Discrepancy Planner
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Cross-references college timetable slots against ERP uploads to forecast attendance before faculty marks them.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => markAll("P")}
            className="btn btn-subtle text-xs"
            title="Forecast 100% attendance on all unmarked classes"
          >
            <UserCheck className="h-3.5 w-3.5 text-emerald-400" /> Mark All Attended
          </button>
          <button
            type="button"
            onClick={() => markAll("A")}
            className="btn btn-subtle text-xs"
            title="Forecast all unmarked classes as skipped"
          >
            <UserX className="h-3.5 w-3.5 text-rose-400" /> Mark All Skipped
          </button>
          {Object.keys(userMarks).length > 0 && (
            <button type="button" onClick={resetMarks} className="btn btn-ghost text-xs text-zinc-400">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>
      </section>

      {/* 2. Live Forecast Impact Banner */}
      <section className="card relative overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow flex items-center gap-1.5 text-brand-400">
              <Zap className="h-3.5 w-3.5" /> Live Attendance Simulation
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <span className="num text-3xl font-extrabold text-white sm:text-4xl">
                {simulation.simPct.toFixed(2)}%
              </span>
              {simulation.addedHeld > 0 && (
                <span
                  className={cn(
                    "num text-sm font-semibold",
                    simulation.diffPct >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {simulation.diffPct >= 0 ? `+${simulation.diffPct.toFixed(2)}%` : `${simulation.diffPct.toFixed(2)}%`}
                </span>
              )}
              <span className="num text-xs text-zinc-400">
                (Official ERP Baseline: {metrics.percentage.toFixed(2)}%)
              </span>
            </div>
            <p className="num mt-1 text-xs text-zinc-400">
              {simulation.simPresent} attended of {simulation.simHeld} held
              {simulation.addedHeld > 0 && (
                <span className="text-zinc-300">
                  {" "}
                  (Simulated: +{simulation.addedPresent} P / +{simulation.addedHeld} Held across{" "}
                  {Object.keys(userMarks).length} marked slots)
                </span>
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 sm:min-w-[14rem]">
            <p className="text-xs text-zinc-400">Weekly Unmarked Classes</p>
            <p className="num mt-1 text-lg font-bold text-white">
              {allUnmarkedPeriods.length} classes pending
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {allUnmarkedPeriods.filter((x) => x.period.code.startsWith("25CS3")).length} belong to DSA / OOPS
            </p>
          </div>
        </div>
      </section>

      {/* 3. Weekday Segmented Bar */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {WEEK_DATES.map((d) => {
            const rec = weekReconciliations.get(d.date);
            const isSelected = selectedDate === d.date;
            const isToday = d.date === today;
            const unmarkedCount = rec?.unmarkedHeld || 0;

            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDate(d.date)}
                className={cn(
                  "relative flex flex-1 flex-col items-start gap-1 rounded-2xl border px-3.5 py-3 text-left transition-all min-w-[6.5rem] sm:min-w-[7.5rem]",
                  isSelected
                    ? "border-brand-500/50 bg-brand-500/10 shadow-sm"
                    : "border-white/[0.07] bg-ink-850/60 hover:border-white/[0.14] hover:bg-white/[0.03]"
                )}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className={cn("text-xs font-semibold", isSelected ? "text-brand-300" : "text-zinc-300")}>
                    {d.label}
                  </span>
                  {isToday && <span className="chip chip-brand px-1.5 py-0.5 text-[0.6rem]">Today</span>}
                </div>
                <span className="num text-xs text-zinc-400">{d.full.replace(" (Today)", "")}</span>
                <div className="mt-1 flex items-center gap-1">
                  {unmarkedCount === 0 ? (
                    <span className="chip chip-safe text-[0.65rem] py-0 px-1.5">All 8 on ERP</span>
                  ) : (
                    <span className="chip chip-warn text-[0.65rem] py-0 px-1.5">{unmarkedCount} unmarked</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* 4. Active Day Detail Card */}
        <div className="card space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">
                  {activeDay.weekdayName} • {selectedDate}
                </h2>
                {selectedDate === today && <span className="chip chip-brand text-xs">Today</span>}
              </div>
              <p className="mt-1 text-xs text-zinc-400">
                {activeDay.erpHeld} of {activeDay.scheduledHeld} periods marked on college ERP
                {activeDay.unmarkedHeld > 0 && (
                  <span className="text-amber-300"> · {activeDay.unmarkedHeld} periods awaiting faculty entry</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="chip chip-neutral num text-xs">
                {activeDay.erpHeld} / {activeDay.scheduledHeld} ERP Held
              </span>
            </div>
          </div>

          {/* Discrepancy Alerts for this day */}
          {activeDay.discrepancies.length > 0 && (
            <div className="rounded-2xl border border-amber-400/25 bg-amber-950/30 p-4 text-xs text-amber-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-300">Timetable Discrepancy Detected</p>
                  {activeDay.discrepancies.map((msg, i) => (
                    <p key={i} className="text-amber-200/90 leading-relaxed">
                      {msg}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Periods Timeline List */}
          <div className="space-y-3">
            {activeDay.periods.map((slot) => {
              const isErpMarked = slot.status === "erp_present" || slot.status === "erp_absent";
              const userMark = userMarks[slot.periodKey];

              return (
                <div
                  key={slot.periodKey}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-4 transition-all",
                    isErpMarked
                      ? "border-white/[0.06] bg-ink-900/50"
                      : userMark === "P"
                      ? "border-emerald-500/30 bg-emerald-950/20 shadow-sm"
                      : userMark === "A"
                      ? "border-rose-500/30 bg-rose-950/20"
                      : "border-white/[0.1] bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-center min-w-[4.5rem]">
                      <span className="text-[0.65rem] font-bold text-zinc-400">{slot.periodLabel}</span>
                      <span className="num mt-0.5 text-[0.7rem] text-zinc-500">{slot.time}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="num text-xs font-semibold text-zinc-300">{slot.code}</span>
                        {slot.isLab && <span className="chip chip-neutral text-[0.6rem] py-0 px-1.5">Lab</span>}
                        {slot.held > 1 && (
                          <span className="chip chip-neutral text-[0.6rem] py-0 px-1.5">{slot.held} Periods</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-white leading-snug">{slot.subjectName}</h3>
                      <p className="text-xs text-zinc-500">
                        Faculty: <span className="text-zinc-400">{slot.facultyLabel}</span>
                      </p>
                      {slot.discrepancyNote && (
                        <p className="text-[0.7rem] text-amber-300/90 flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3 inline shrink-0" />
                          {slot.discrepancyNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status / Interactive Toggle */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isErpMarked ? (
                      <span
                        className={cn(
                          "chip text-xs font-medium py-1 px-3",
                          slot.status === "erp_present" ? "chip-safe" : "chip-warn"
                        )}
                      >
                        {slot.status === "erp_present" ? "ERP Present (P)" : "ERP Absent (A)"}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.04] p-1">
                        <button
                          type="button"
                          onClick={() => togglePeriodMark(slot.periodKey, "P")}
                          className={cn(
                            "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                            userMark === "P"
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "text-zinc-400 hover:text-white"
                          )}
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Present
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePeriodMark(slot.periodKey, "A")}
                          className={cn(
                            "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                            userMark === "A" ? "bg-rose-500 text-white shadow-sm" : "text-zinc-400 hover:text-white"
                          )}
                        >
                          <UserX className="h-3.5 w-3.5" /> Skip
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Weekly Pattern & Insights Callout */}
      <section className="card p-5 sm:p-6 space-y-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-400" /> Key Insights & Timetable Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-400 leading-relaxed">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-1.5">
            <p className="font-semibold text-zinc-200">The DSA Lag Pattern</p>
            <p>
              Out of 7 unmarked periods across Mon–Thu, <strong>6 periods belong to DSA (25CS303 & 25CS353)</strong> by
              Ms. Mansi Aggarwal & Dr. Dhyenendra Jain. Marking these as attended in this planner allows you to calculate
              your accurate MT2 bunks without waiting for faculty batch uploads.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 space-y-1.5">
            <p className="font-semibold text-zinc-200">19 Nov Data Visualization Anomaly</p>
            <p>
              ERP recorded 1 single lecture of 25VA301 (Data Visualization) on Thursday 19 Nov, whereas your timetable
              scheduled Holistic Skill & Innovation III (25VA352). AttendX tracks this substitution seamlessly so your
              percentage remains mathematically intact.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
