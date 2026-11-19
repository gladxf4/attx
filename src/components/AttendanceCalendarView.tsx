"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ChevronRight,
  RotateCcw,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  Beaker,
  BookOpen
} from "lucide-react";
import { AttendanceMetrics, SubjectRecord } from "@/lib/types";
import {
  getNovemberAttendanceSchedule,
  DayAttendanceLog,
  PeriodDetail
} from "@/lib/calendarData";

interface AttendanceCalendarViewProps {
  metrics: AttendanceMetrics;
  subjects?: SubjectRecord[];
}

export const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({
  metrics,
  subjects = [],
}) => {
  const [activeTab, setActiveTab] = useState<"calendar" | "whatif">("calendar");

  // Get all days for November 2026
  const rawSchedule = useMemo(() => {
    return getNovemberAttendanceSchedule(subjects);
  }, [subjects, metrics.thursdayHeld, metrics.thursdayPresent]);

  // Selected date for detail view (defaults to today 19 Nov)
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-11-19");

  // What-If Plan: map of dateStr -> planned attended classes (0..8)
  // Default: attend all 8 classes on upcoming working days
  const [plannedAttendance, setPlannedAttendance] = useState<Record<string, number>>({
    "2026-11-20": 8, // Fri 20 Nov (Tomorrow)
    "2026-11-23": 8, // Mon 23 Nov
    "2026-11-25": 8, // Wed 25 Nov
    "2026-11-26": 8, // Thu 26 Nov
    "2026-11-27": 8, // Fri 27 Nov
  });

  const upcomingWorkingDates = [
    { dateStr: "2026-11-20", display: "Fri 20 Nov (Tomorrow)" },
    { dateStr: "2026-11-23", display: "Mon 23 Nov" },
    { dateStr: "2026-11-25", display: "Wed 25 Nov" },
    { dateStr: "2026-11-26", display: "Thu 26 Nov" },
    { dateStr: "2026-11-27", display: "Fri 27 Nov (Last Working Day)" },
  ];

  // Calculate live What-If Forecast at MT2 Cutoff (Nov 30)
  const whatIfCalculation = useMemo(() => {
    const totalFutureHeld = 40; // 5 working days * 8 lectures
    let totalPlannedAttended = 0;
    let totalPlannedBunks = 0;

    upcomingWorkingDates.forEach((d) => {
      const att = plannedAttendance[d.dateStr] ?? 8;
      totalPlannedAttended += att;
      totalPlannedBunks += 8 - att;
    });

    const finalHeldAtMT2 = metrics.currentTotalHeld + totalFutureHeld;
    const finalPresentAtMT2 = metrics.currentTotalPresent + totalPlannedAttended;
    const finalPct = finalHeldAtMT2 > 0 ? (finalPresentAtMT2 / finalHeldAtMT2) * 100 : 0;
    const targetPct = metrics.targetPercentage || 75;
    const targetFrac = targetPct / 100;
    const isEligible = finalPct >= targetPct;

    const requiredEffectivePresent = Math.ceil(targetFrac * finalHeldAtMT2);
    const margin = finalPresentAtMT2 - requiredEffectivePresent;

    return {
      totalFutureHeld,
      totalPlannedAttended,
      totalPlannedBunks,
      finalHeldAtMT2,
      finalPresentAtMT2,
      finalPct: Number(finalPct.toFixed(2)),
      isEligible,
      targetPct,
      margin,
    };
  }, [metrics, plannedAttendance]);

  // Update planned attendance for a day
  const setDayPlan = (dateStr: string, attended: number) => {
    setPlannedAttendance((prev) => ({
      ...prev,
      [dateStr]: Math.max(0, Math.min(8, attended)),
    }));
  };

  // Reset What-If simulation
  const handleResetWhatIf = () => {
    setPlannedAttendance({
      "2026-11-20": 8,
      "2026-11-23": 8,
      "2026-11-25": 8,
      "2026-11-26": 8,
      "2026-11-27": 8,
    });
  };

  // Preset: Skip 4 tomorrow (Friday)
  const handlePresetSkip4Tomorrow = () => {
    setPlannedAttendance((prev) => ({
      ...prev,
      "2026-11-20": 4,
    }));
  };

  // Preset: Distribute safe bunks evenly
  const handlePresetMaxSafe = () => {
    const safeBunks = metrics.safeBunksRemaining;
    const newPlan: Record<string, number> = {
      "2026-11-20": 8,
      "2026-11-23": 8,
      "2026-11-25": 8,
      "2026-11-26": 8,
      "2026-11-27": 8,
    };

    let bunksToDistribute = safeBunks;
    for (const d of upcomingWorkingDates) {
      if (bunksToDistribute <= 0) break;
      const takeBunks = Math.min(bunksToDistribute, 4); // Take half days first
      newPlan[d.dateStr] = 8 - takeBunks;
      bunksToDistribute -= takeBunks;
    }
    setPlannedAttendance(newPlan);
  };

  // Find currently selected day object
  const selectedDay = useMemo(() => {
    return (
      rawSchedule.find((d) => d.dateStr === selectedDateStr) ||
      rawSchedule.find((d) => d.isToday) ||
      rawSchedule[0]
    );
  }, [rawSchedule, selectedDateStr]);

  return (
    <div className="clean-card p-5 sm:p-6 space-y-5 border border-zinc-800/80 bg-zinc-950/70 shadow-xl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <CalendarIcon className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Datewise Attendance & Schedule Forecast</h2>
            <p className="text-xs text-zinc-400">
              Inspect past classes (P/Total) or forecast upcoming daily bunks before Midterms
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-zinc-900 rounded-lg border border-zinc-800 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`px-3 py-1 rounded-md font-medium transition ${
              activeTab === "calendar"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Attendance Calendar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("whatif")}
            className={`px-3 py-1 rounded-md font-medium transition flex items-center space-x-1.5 ${
              activeTab === "whatif"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>What-If Schedule</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DATEWISE CALENDAR */}
      {activeTab === "calendar" && (
        <div className="space-y-4">
          {/* Days Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {rawSchedule.map((day) => {
              const isSelected = selectedDay.dateStr === day.dateStr;
              const hasPlannedForecast =
                day.isFuture && !day.isWeekend && !day.isHoliday && !day.isExamDay;
              const plannedAtt = plannedAttendance[day.dateStr] ?? 8;
              const plannedBunks = 8 - plannedAtt;

              let ratioText = "";
              let ratioBadgeColor = "";
              let cardBg = "bg-zinc-900/50 border-zinc-800/80";

              if (day.isExamDay) {
                ratioText = "MT2 Exam";
                ratioBadgeColor = "text-purple-300 bg-purple-950/40 border-purple-800/50";
                cardBg = "bg-purple-950/15 border-purple-900/40";
              } else if (day.isHoliday) {
                ratioText = day.holidayReason || "Holiday";
                ratioBadgeColor = "text-amber-300 bg-amber-950/40 border-amber-800/50";
                cardBg = "bg-amber-950/10 border-amber-900/30";
              } else if (day.isWeekend) {
                ratioText = "Weekend";
                ratioBadgeColor = "text-zinc-400 bg-zinc-900 border-zinc-800";
                cardBg = "bg-zinc-950 border-zinc-900 text-zinc-600";
              } else if (day.isToday) {
                ratioText = `${day.totalPresent}/${day.totalHeld} Attended`;
                ratioBadgeColor = "text-blue-300 bg-blue-950/40 border-blue-800/50";
                cardBg = "bg-blue-950/20 border-blue-700/60 shadow-sm shadow-blue-500/10";
              } else if (hasPlannedForecast) {
                ratioText = `${plannedAtt}/8 Plan`;
                ratioBadgeColor =
                  plannedBunks > 0
                    ? "text-amber-300 bg-amber-950/40 border-amber-800/50"
                    : "text-emerald-300 bg-emerald-950/40 border-emerald-800/50";
                cardBg = "bg-zinc-900/70 border-zinc-800";
              } else {
                // Past working days (16, 17, 18 Nov)
                const pct = day.totalHeld > 0 ? (day.totalPresent / day.totalHeld) * 100 : 0;
                ratioText = `${day.totalPresent}/${day.totalHeld}`;
                ratioBadgeColor =
                  pct >= 75
                    ? "text-emerald-300 bg-emerald-950/40 border-emerald-800/50"
                    : "text-rose-300 bg-rose-950/40 border-rose-800/50";
              }

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between min-h-[78px] ${cardBg} ${
                    isSelected
                      ? "ring-2 ring-emerald-400 border-transparent shadow-lg bg-zinc-900"
                      : "hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-white">{day.displayDate}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{day.dayShort}</span>
                  </div>

                  <div className="mt-2">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border inline-block ${ratioBadgeColor}`}
                    >
                      {ratioText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Date Detail Drawer */}
          <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-white font-mono">
                  {selectedDay.dayNumber}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                    <span>
                      {selectedDay.dayName}, {selectedDay.displayDate} 2026
                    </span>
                    {selectedDay.isToday && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30">
                        Today
                      </span>
                    )}
                    {selectedDay.isFuture && !selectedDay.isWeekend && !selectedDay.isHoliday && !selectedDay.isExamDay && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30">
                        Upcoming Forecast
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {selectedDay.isExamDay
                      ? "Midterm Examinations (MT2) officially begin"
                      : selectedDay.isHoliday || selectedDay.isWeekend
                      ? selectedDay.holidayReason || "College Closed"
                      : `${selectedDay.totalPresent} of ${selectedDay.totalHeld} periods attended`}
                  </span>
                </div>
              </div>

              {/* What-If quick toggle if viewing an upcoming working date */}
              {selectedDay.isFuture && !selectedDay.isWeekend && !selectedDay.isHoliday && !selectedDay.isExamDay && (
                <div className="flex items-center space-x-1.5 self-start sm:self-auto text-xs bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                  <span className="text-[11px] text-zinc-400 px-1">Simulate Day:</span>
                  <button
                    type="button"
                    onClick={() => setDayPlan(selectedDay.dateStr, 8)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                      (plannedAttendance[selectedDay.dateStr] ?? 8) === 8
                        ? "bg-emerald-500 text-zinc-950 font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Attend All (8/8)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayPlan(selectedDay.dateStr, 4)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                      (plannedAttendance[selectedDay.dateStr] ?? 8) === 4
                        ? "bg-amber-400 text-zinc-950 font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Skip 4 (Half Day)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayPlan(selectedDay.dateStr, 0)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                      (plannedAttendance[selectedDay.dateStr] ?? 8) === 0
                        ? "bg-rose-500 text-white font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Skip All (0/8)
                  </button>
                </div>
              )}
            </div>

            {/* Periods List */}
            {selectedDay.periods.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                No academic lectures scheduled for this date.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium px-1">
                  <span>Period & Timing</span>
                  <span>Subject & Type</span>
                  <span>Attendance Status</span>
                </div>

                <div className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800 bg-zinc-950/50 overflow-hidden text-xs">
                  {selectedDay.periods.map((p, idx) => {
                    const isLab = p.isLab;
                    const isFullPresent = p.present === p.held && p.held > 0;
                    const isPartial = p.present > 0 && p.present < p.held;
                    const isAbsent = p.held > 0 && p.present === 0;

                    let statusBadge = "text-zinc-400 bg-zinc-800";
                    let statusLabel = `${p.present}/${p.held}`;

                    if (isFullPresent) {
                      statusBadge = "text-emerald-300 bg-emerald-500/15 border border-emerald-500/30";
                      statusLabel = isLab ? `Present (2/2)` : "Present (P)";
                    } else if (isPartial) {
                      statusBadge = "text-amber-300 bg-amber-500/15 border border-amber-500/30";
                      statusLabel = `Partial (${p.present}/${p.held})`;
                    } else if (isAbsent) {
                      statusBadge = "text-rose-300 bg-rose-500/15 border border-rose-500/30";
                      statusLabel = isLab ? `Absent (0/2)` : "Absent (A)";
                    }

                    return (
                      <div
                        key={idx}
                        className="p-3 flex items-center justify-between hover:bg-zinc-900/60 transition"
                      >
                        {/* Period Number & Time */}
                        <div className="flex items-center space-x-2.5 w-1/4">
                          <span className="font-mono text-zinc-300 text-xs font-semibold">
                            P{p.periodNumber}
                            {isLab ? "-P" + (p.periodNumber + 1) : ""}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
                            {p.timeSlot}
                          </span>
                        </div>

                        {/* Subject Details */}
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white truncate">{p.subjectName}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${
                                isLab
                                  ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                                  : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                              }`}
                            >
                              {isLab ? "Lab (2 Lec)" : "Lecture"}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-500">{p.subjectCode}</span>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 text-right">
                          <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${statusBadge}`}>
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

      {/* TAB 2: WHAT-IF SCHEDULE FORECASTER */}
      {activeTab === "whatif" && (
        <div className="space-y-5">
          {/* MT2 Cutoff Forecast Hero Banner */}
          <div className="p-4 sm:p-5 rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs text-zinc-400 font-medium">
                  Projected Attendance Entering Midterms (Nov 30):
                </span>
                <div className="flex items-baseline space-x-3 mt-1">
                  <span className="text-4xl sm:text-5xl font-extrabold font-mono text-white">
                    {whatIfCalculation.finalPct}%
                  </span>
                  <span
                    className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                      whatIfCalculation.isEligible
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-300 border-rose-500/30"
                    }`}
                  >
                    {whatIfCalculation.isEligible ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <span>Eligible for MT2 (≥{whatIfCalculation.targetPct}%)</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-rose-400" />
                        <span>Debarred from MT2 (&lt;{whatIfCalculation.targetPct}%)</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Cushion Stats */}
              <div className="flex flex-col items-start sm:items-end text-xs space-y-1">
                <span className="text-zinc-300 font-medium">
                  Planned Bunks:{" "}
                  <strong className="text-white font-mono text-sm">
                    {whatIfCalculation.totalPlannedBunks}
                  </strong>{" "}
                  classes
                </span>
                <span className="text-[11px] text-zinc-500">
                  {whatIfCalculation.margin >= 0 ? (
                    <span className="text-emerald-400">
                      +{whatIfCalculation.margin} cushion classes above threshold
                    </span>
                  ) : (
                    <span className="text-rose-400">
                      Deficit of {Math.abs(whatIfCalculation.margin)} classes
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Quick Presets Row */}
            <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-zinc-400 mr-1 text-[11px]">Quick Tests:</span>
              <button
                type="button"
                onClick={handlePresetSkip4Tomorrow}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition"
              >
                Skip 4 Tomorrow (Friday)
              </button>
              <button
                type="button"
                onClick={handlePresetMaxSafe}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 hover:text-white border border-zinc-700 transition"
              >
                Distribute Max Safe Bunks ({metrics.safeBunksRemaining})
              </button>
              <button
                type="button"
                onClick={handleResetWhatIf}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 transition flex items-center space-x-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset (Attend All)</span>
              </button>
            </div>
          </div>

          {/* Day-by-Day Schedule Planner */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200">
                Plan Your Upcoming Working Days (8 lecs / day)
              </span>
              <span className="text-[11px] text-zinc-500">
                Adjust each day to see the exact MT2 percentage outcome
              </span>
            </div>

            <div className="space-y-2">
              {upcomingWorkingDates.map((day) => {
                const attended = plannedAttendance[day.dateStr] ?? 8;
                const bunks = 8 - attended;

                return (
                  <div
                    key={day.dateStr}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition hover:border-zinc-700"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-white">{day.display}</h4>
                      <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-0.5">
                        <span className="text-emerald-400 font-medium">Attending {attended}</span>
                        <span>•</span>
                        <span className={bunks > 0 ? "text-rose-400 font-medium" : "text-zinc-500"}>
                          Bunking {bunks}
                        </span>
                      </div>
                    </div>

                    {/* Quick Button Selector for that day */}
                    <div className="flex items-center space-x-1.5 self-end sm:self-auto text-xs">
                      <button
                        type="button"
                        onClick={() => setDayPlan(day.dateStr, 8)}
                        className={`px-3 py-1 rounded-lg border transition ${
                          attended === 8
                            ? "bg-emerald-500 text-zinc-950 border-emerald-400 font-bold"
                            : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                        }`}
                      >
                        Attend All (8)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDayPlan(day.dateStr, 4)}
                        className={`px-3 py-1 rounded-lg border transition ${
                          attended === 4
                            ? "bg-amber-400 text-zinc-950 border-amber-300 font-bold"
                            : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                        }`}
                      >
                        Skip 4 (Half Day)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDayPlan(day.dateStr, 0)}
                        className={`px-3 py-1 rounded-lg border transition ${
                          attended === 0
                            ? "bg-rose-500 text-white border-rose-400 font-bold"
                            : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                        }`}
                      >
                        Skip 8 (Full Bunk)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-[11px] text-zinc-500 flex items-center space-x-2">
            <HelpCircle className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span>
              This simulation is an ephemeral projection. You can freely plan bunks without affecting your actual saved attendance records.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
