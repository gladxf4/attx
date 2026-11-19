"use client";

import React from "react";
import { Calendar as CalendarIcon, CheckCircle2, Clock, AlertCircle, Sparkles } from "lucide-react";
import { AttendanceMetrics, CalendarDayInfo } from "@/lib/types";
import { CALENDAR_DAYS_UNTIL_MT2 } from "@/lib/attendanceEngine";

interface MT2CalendarViewProps {
  metrics: AttendanceMetrics;
}

export const MT2CalendarView: React.FC<MT2CalendarViewProps> = ({ metrics }) => {
  return (
    <div className="rounded-2xl glass-card p-6 sm:p-7 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">MT2 Roadmap & College Calendar</h2>
            <p className="text-xs text-slate-400">Midterm 2 starts Monday, 30 November 2026</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-300">
            {metrics.workingDaysUntilMT2} Working Days Left
          </span>
          <span className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 text-xs font-semibold text-cyan-300">
            ≈ {metrics.totalLecturesUntilMT2} Lectures Left
          </span>
        </div>
      </div>

      {/* College Schedule Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {CALENDAR_DAYS_UNTIL_MT2.map((day, idx) => {
          let cardStyle = "border-slate-800/80 bg-slate-900/40 text-slate-300";
          let badgeText = `${day.classesScheduled} lecs`;
          let badgeStyle = "bg-slate-800 text-slate-400 border-slate-700";

          if (day.isExamDay) {
            cardStyle = "border-rose-500/40 bg-gradient-to-br from-rose-950/30 to-slate-900 text-rose-200 glow-rose";
            badgeText = "EXAM DAY";
            badgeStyle = "bg-rose-500/20 text-rose-300 border-rose-500/40";
          } else if (day.isHoliday) {
            cardStyle = "border-amber-500/30 bg-amber-500/5 text-amber-200";
            badgeText = day.holidayReason || "Holiday";
            badgeStyle = "bg-amber-500/20 text-amber-300 border-amber-500/30";
          } else if (day.dayName.includes("Today")) {
            cardStyle = "border-indigo-500/40 bg-indigo-500/10 text-indigo-200 glow-primary";
            badgeText = "Today";
            badgeStyle = "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
          }

          return (
            <div key={idx} className={`rounded-xl border p-3 flex flex-col justify-between transition hover:scale-[1.02] ${cardStyle}`}>
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold">{day.dateStr}</span>
                  <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 border ${badgeStyle}`}>
                    {badgeText}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-300">{day.dayName}</div>
              </div>

              <div className="mt-2 text-[11px] text-slate-400">
                {day.isExamDay ? (
                  <span className="text-rose-400 font-semibold">MT2 Begins!</span>
                ) : day.isHoliday ? (
                  <span>{day.holidayReason}</span>
                ) : (
                  <span>Regular 8-period day</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MT2 Strategy Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
            MT2 Attendance Target Strategy
          </h4>
          <p className="text-xs text-slate-300">
            {metrics.isEligibleForMT2
              ? `You need to attend at least ${metrics.minClassesToAttendBeforeMT2} of the next ${metrics.totalLecturesUntilMT2} lectures to maintain ≥75% eligibility.`
              : `To become eligible before MT2, attend at least ${metrics.classesNeededFor75} lectures consecutively!`}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-slate-400">Target:</span>
          <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300">
            {metrics.minClassesToAttendBeforeMT2} / {metrics.totalLecturesUntilMT2} Classes Needed
          </span>
        </div>
      </div>
    </div>
  );
};
