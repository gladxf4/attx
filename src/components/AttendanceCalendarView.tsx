"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  Minus,
  Plus,
  X,
  HelpCircle
} from "lucide-react";
import { AttendanceMetrics, SubjectRecord } from "@/lib/types";
import {
  getNovemberAttendanceSchedule,
  DayAttendanceLog,
  PeriodDetail
} from "@/lib/calendarData";
import { getDynamicMT2Horizon } from "@/lib/attendanceEngine";

interface AttendanceCalendarViewProps {
  metrics: AttendanceMetrics;
  subjects?: SubjectRecord[];
  erpDatewise?: Record<string, any>;
  onUpdateTodayTotals?: (held: number, present: number) => void;
  onUpdateSubjects?: (subjects: SubjectRecord[]) => void;
  activeModalDateStr?: string | null;
  onCloseModal?: () => void;
  onScrollToPeriodTracker?: () => void;
}

export const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({
  metrics,
  subjects = [],
  erpDatewise = {},
  onUpdateTodayTotals,
  onUpdateSubjects,
  activeModalDateStr,
  onCloseModal,
  onScrollToPeriodTracker,
}) => {
  const [viewMode, setViewMode] = useState<"calendar" | "forecast">("calendar");

  // Dynamic MT2 Horizon (updates dynamically as dates progress)
  const { remainingWorkingDaysCount, upcomingDates, totalLecturesRemaining } = useMemo(() => {
    return getDynamicMT2Horizon();
  }, []);

  // Raw Schedule for November 2026
  const rawSchedule = useMemo(() => {
    return getNovemberAttendanceSchedule(subjects, erpDatewise);
  }, [subjects, erpDatewise, metrics.thursdayHeld, metrics.thursdayPresent]);

  // Selected date for detail modal
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-11-19");

  // If parent requests a specific date modal (e.g. from Today marked click in Hero)
  React.useEffect(() => {
    if (activeModalDateStr) {
      setSelectedDateStr(activeModalDateStr);
    }
  }, [activeModalDateStr]);

  // Planned Attendance Map for upcoming working dates (default 8 attended per working day)
  const [plannedAttendance, setPlannedAttendance] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    upcomingDates.forEach((d) => {
      init[d.dateStr] = 8;
    });
    return init;
  });

  // Calculate live What-If Forecast at MT2 Cutoff (Nov 30)
  const whatIfCalculation = useMemo(() => {
    let totalPlannedAttended = 0;
    let totalPlannedBunks = 0;

    upcomingDates.forEach((d) => {
      const att = plannedAttendance[d.dateStr] ?? 8;
      const clampedAtt = Math.max(0, Math.min(8, Number(att) || 0));
      totalPlannedAttended += clampedAtt;
      totalPlannedBunks += 8 - clampedAtt;
    });

    const finalHeldAtMT2 = metrics.currentTotalHeld + totalLecturesRemaining;
    const finalPresentAtMT2 = metrics.currentTotalPresent + totalPlannedAttended;
    const finalPct = finalHeldAtMT2 > 0 ? (finalPresentAtMT2 / finalHeldAtMT2) * 100 : 0;
    const targetPct = metrics.targetPercentage || 75;
    const targetFrac = targetPct / 100;
    const isEligible = finalPct >= targetPct;

    const requiredEffectivePresent = Math.ceil(targetFrac * finalHeldAtMT2);
    const margin = finalPresentAtMT2 - requiredEffectivePresent;

    return {
      totalLecturesRemaining,
      remainingWorkingDaysCount,
      totalPlannedAttended,
      totalPlannedBunks,
      finalHeldAtMT2,
      finalPresentAtMT2,
      finalPct: Number(finalPct.toFixed(2)),
      isEligible,
      targetPct,
      margin,
    };
  }, [metrics, plannedAttendance, upcomingDates, totalLecturesRemaining, remainingWorkingDaysCount]);

  // Set planned attendance with bounds checking & exception handling
  const setDayPlan = (dateStr: string, attended: number) => {
    const sanitized = Math.max(0, Math.min(8, Math.round(Number(attended) || 0)));
    setPlannedAttendance((prev) => ({
      ...prev,
      [dateStr]: sanitized,
    }));
  };

  const incrementDayPlan = (dateStr: string, delta: number) => {
    const current = plannedAttendance[dateStr] ?? 8;
    setDayPlan(dateStr, current + delta);
  };

  const handleResetWhatIf = () => {
    const resetPlan: Record<string, number> = {};
    upcomingDates.forEach((d) => {
      resetPlan[d.dateStr] = 8;
    });
    setPlannedAttendance(resetPlan);
  };

  const handlePresetSkip4Tomorrow = () => {
    if (upcomingDates.length > 0) {
      const tomorrowStr = upcomingDates[0].dateStr;
      setDayPlan(tomorrowStr, 4);
    }
  };

  const selectedDay = useMemo(() => {
    return (
      rawSchedule.find((d) => d.dateStr === selectedDateStr) ||
      rawSchedule.find((d) => d.isToday) ||
      rawSchedule[0]
    );
  }, [rawSchedule, selectedDateStr]);

  return (
    <div className="apple-card p-6 sm:p-7 space-y-6">
      {/* Header & Apple-style Segmented View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-white/[0.06]">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Schedule & Forecast
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Datewise attendance history and MT2 midterm eligibility forecaster
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center p-1 bg-zinc-900/90 rounded-xl border border-white/[0.08] self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === "calendar"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setViewMode("forecast")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              viewMode === "forecast"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Forecast Planner
          </button>
        </div>
      </div>

      {/* Dynamic Forecast Metric Banner (Visible in both views) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block mb-0.5">
            Projected Attendance at Cutoff (30 Nov)
          </span>
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
              {whatIfCalculation.finalPct}%
            </span>
            <span
              className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                whatIfCalculation.isEligible
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              {whatIfCalculation.isEligible ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Eligible (≥{whatIfCalculation.targetPct}%)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Below Threshold</span>
                </>
              )}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:items-end text-xs space-y-1">
          <div className="text-zinc-300">
            Upcoming:{" "}
            <span className="font-mono font-semibold text-white">
              {whatIfCalculation.totalLecturesRemaining} lectures
            </span>{" "}
            across {whatIfCalculation.remainingWorkingDaysCount} working days
          </div>
          <div className="text-[11px] text-zinc-400">
            {whatIfCalculation.totalPlannedBunks > 0 ? (
              <span>
                Planned Bunks:{" "}
                <strong className="text-white font-mono">
                  {whatIfCalculation.totalPlannedBunks}
                </strong>{" "}
                classes
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">All remaining classes planned</span>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: CALENDAR VIEW */}
      {viewMode === "calendar" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {rawSchedule.map((day) => {
              const isSelected = selectedDay.dateStr === day.dateStr;
              const isUpcoming = day.isFuture && !day.isWeekend && !day.isHoliday && !day.isExamDay;
              const plannedAtt = plannedAttendance[day.dateStr] ?? 8;
              const plannedBunk = 8 - plannedAtt;

              let badge = "";
              let badgeColor = "text-zinc-400 bg-zinc-900 border-white/[0.06]";
              let tileClass = "bg-zinc-900/40 border-white/[0.06]";

              if (day.isExamDay) {
                badge = "Cutoff";
                badgeColor = "text-purple-300 bg-purple-950/40 border-purple-800/40";
                tileClass = "bg-purple-950/15 border-purple-900/30";
              } else if (day.isHoliday) {
                badge = "Holiday";
                badgeColor = "text-amber-300 bg-amber-950/40 border-amber-800/40";
                tileClass = "bg-amber-950/10 border-amber-900/20";
              } else if (day.isWeekend) {
                badge = "Weekend";
                badgeColor = "text-zinc-500 bg-zinc-950 border-white/[0.04]";
                tileClass = "bg-zinc-950/60 border-white/[0.04] text-zinc-600";
              } else if (day.isToday) {
                badge = `${day.totalPresent}/${day.totalHeld} marked`;
                badgeColor = "text-blue-300 bg-blue-950/40 border-blue-800/40";
                tileClass = "bg-blue-950/20 border-blue-600/50 shadow-sm shadow-blue-500/10";
              } else if (isUpcoming) {
                badge = `${plannedAtt}/8 plan`;
                badgeColor =
                  plannedBunk > 0
                    ? "text-amber-300 bg-amber-950/40 border-amber-800/40"
                    : "text-emerald-300 bg-emerald-950/40 border-emerald-800/40";
                tileClass = "bg-zinc-900/60 border-white/[0.06]";
              } else {
                // Past days (16, 17, 18 Nov)
                badge = `${day.totalPresent}/${day.totalHeld}`;
                const pct = day.totalHeld > 0 ? (day.totalPresent / day.totalHeld) * 100 : 0;
                badgeColor =
                  pct >= 75
                    ? "text-emerald-300 bg-emerald-950/40 border-emerald-800/40"
                    : "text-rose-300 bg-rose-950/40 border-rose-800/40";
              }

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between min-h-[76px] ${tileClass} ${
                    isSelected
                      ? "ring-2 ring-white border-transparent bg-zinc-800/90 shadow-md"
                      : "hover:border-white/[0.18]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-zinc-100">{day.displayDate}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{day.dayShort}</span>
                  </div>
                  <div className="mt-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border inline-block ${badgeColor}`}>
                      {badge}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Date Detail Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/70 border border-white/[0.08] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <span>
                    {selectedDay.dayName}, {selectedDay.displayDate} 2026
                  </span>
                  {selectedDay.isToday && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                      Today
                    </span>
                  )}
                  {selectedDay.isFuture && !selectedDay.isWeekend && !selectedDay.isHoliday && !selectedDay.isExamDay && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Forecast
                    </span>
                  )}
                </h3>
                <span className="text-xs text-zinc-400 mt-0.5 block">
                  {selectedDay.isExamDay
                    ? "Midterm Examinations (MT2) officially begin"
                    : selectedDay.isHoliday || selectedDay.isWeekend
                    ? selectedDay.holidayReason || "College Closed"
                    : `${selectedDay.totalPresent} of ${selectedDay.totalHeld} periods attended`}
                </span>
              </div>

              {/* What-If Steppers inside Day Detail for upcoming dates */}
              {selectedDay.isFuture && !selectedDay.isWeekend && !selectedDay.isHoliday && !selectedDay.isExamDay && (
                <div className="flex items-center space-x-2 bg-zinc-950 p-1.5 rounded-xl border border-white/[0.08] text-xs">
                  <span className="text-[11px] text-zinc-400 px-1">Planned:</span>
                  <div className="flex items-center space-x-1.5 bg-zinc-900 px-2 py-1 rounded-lg border border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => incrementDayPlan(selectedDay.dateStr, -1)}
                      disabled={(plannedAttendance[selectedDay.dateStr] ?? 8) <= 0}
                      className="h-5 w-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-20 flex items-center justify-center transition"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono text-xs font-bold text-white px-1">
                      {plannedAttendance[selectedDay.dateStr] ?? 8} / 8
                    </span>
                    <button
                      type="button"
                      onClick={() => incrementDayPlan(selectedDay.dateStr, 1)}
                      disabled={(plannedAttendance[selectedDay.dateStr] ?? 8) >= 8}
                      className="h-5 w-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-20 flex items-center justify-center transition"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDayPlan(selectedDay.dateStr, 4)}
                    className="px-2 py-1 rounded-lg text-[11px] bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.06] transition"
                  >
                    Half Day (4)
                  </button>
                </div>
              )}
            </div>

            {/* Today's ERP Upload Progress & Quick Link */}
            {selectedDay.isToday && (
              <div className="p-3 bg-zinc-950/60 rounded-xl border border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse inline-block" />
                  <span>
                    <strong>{selectedDay.totalHeld}/8</strong> classes marked today ({selectedDay.periods.filter(p => p.source === "erp").reduce((a, b) => a + b.held, 0)} uploaded to ERP)
                  </span>
                </span>
                {onScrollToPeriodTracker && (
                  <button
                    type="button"
                    onClick={onScrollToPeriodTracker}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 underline underline-offset-2 transition"
                  >
                    Track Today&apos;s Classes ⌵
                  </button>
                )}
              </div>
            )}

            {/* Periods Timetable Breakdown */}
            {selectedDay.periods.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 font-normal">
                No classes scheduled on this date.
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.08] bg-zinc-950/40 overflow-hidden text-xs">
                  {selectedDay.periods.map((p, idx) => {
                    const isLab = p.isLab;
                    const isFullPresent = p.present === p.held && p.held > 0;
                    const isPartial = p.present > 0 && p.present < p.held;
                    const isAbsent = p.held > 0 && p.present === 0;

                    let statusClass = "text-zinc-400 bg-zinc-900";
                    let statusLabel = `${p.present}/${p.held}`;

                    if (isFullPresent) {
                      statusClass = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
                      statusLabel = isLab ? "Present (2/2)" : "Present (P)";
                    } else if (isPartial) {
                      statusClass = "text-amber-400 bg-amber-500/10 border border-amber-500/20";
                      statusLabel = `Partial (${p.present}/${p.held})`;
                    } else if (isAbsent) {
                      statusClass = "text-rose-400 bg-rose-500/10 border border-rose-500/20";
                      statusLabel = isLab ? "Absent (0/2)" : "Absent (A)";
                    }

                    return (
                      <div
                        key={idx}
                        className="p-3 flex items-center justify-between hover:bg-zinc-900/40 transition"
                      >
                        <div className="flex items-center space-x-2.5 w-24 sm:w-28 shrink-0">
                          <span className="font-mono text-zinc-300 text-xs font-semibold">
                            {isLab ? `Lec ${p.periodNumber}-${p.periodNumber + 1}` : `Lec ${p.periodNumber}`}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {p.held} {p.held > 1 ? "lecs" : "lec"}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-zinc-100 truncate">{p.subjectName}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${
                                isLab
                                  ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                                  : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                              }`}
                            >
                              {isLab ? "Lab (2 Lec)" : "Lecture"}
                            </span>
                            {p.source === "erp" && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-white/[0.06] font-mono">
                                ERP
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500">{p.subjectCode}</span>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${statusClass}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: FORECAST PLANNER (Datewise Steppers with Disabled Weekends/Holidays) */}
      {viewMode === "forecast" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs pb-1">
            <span className="text-zinc-300 font-medium">
              Upcoming Working Days Schedule ({totalLecturesRemaining} classes remaining)
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePresetSkip4Tomorrow}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] transition"
              >
                Skip 4 Tomorrow (Friday)
              </button>
              <button
                type="button"
                onClick={handleResetWhatIf}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.08] transition flex items-center space-x-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {upcomingDates.map((day) => {
              const attended = plannedAttendance[day.dateStr] ?? 8;
              const bunks = 8 - attended;

              return (
                <div
                  key={day.dateStr}
                  className="p-3.5 rounded-xl border border-white/[0.08] bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition hover:border-white/[0.14]"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      {day.dayName}, {day.dateStr.replace("2026-11-", "")} Nov 2026
                    </h4>
                    <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-0.5">
                      <span className="text-emerald-400 font-medium">Attending {attended}</span>
                      <span>•</span>
                      <span className={bunks > 0 ? "text-rose-400 font-medium" : "text-zinc-500"}>
                        Bunking {bunks}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto text-xs">
                    {/* Stepper with bounds checking */}
                    <div className="flex items-center space-x-1.5 bg-zinc-950 px-2 py-1 rounded-xl border border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => incrementDayPlan(day.dateStr, -1)}
                        disabled={attended <= 0}
                        className="h-6 w-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-20 flex items-center justify-center transition"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-mono text-xs font-bold text-white px-2">
                        {attended} / 8
                      </span>
                      <button
                        type="button"
                        onClick={() => incrementDayPlan(day.dateStr, 1)}
                        disabled={attended >= 8}
                        className="h-6 w-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 disabled:opacity-20 flex items-center justify-center transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDayPlan(day.dateStr, 4)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] transition"
                    >
                      Half Day (4)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDayPlan(day.dateStr, 0)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] transition"
                    >
                      Bunk All (0)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-zinc-500 pt-1">
            Weekends and holidays are excluded from lecture schedules. The simulation strictly models the cutoff period ending before 30 November examinations.
          </p>
        </div>
      )}
    </div>
  );
};
