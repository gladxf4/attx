"use client";

import React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { AttendanceMetrics } from "@/lib/types";
import { CALENDAR_DAYS_UNTIL_MT2 } from "@/lib/attendanceEngine";

interface MT2CalendarViewProps {
  metrics: AttendanceMetrics;
}

export const MT2CalendarView: React.FC<MT2CalendarViewProps> = ({ metrics }) => {
  return (
    <div className="clean-card p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-white">MT2 Schedule & Working Days</h2>
        </div>
        <div className="text-xs text-zinc-400">
          <span>MT2 Exams start <strong>30 Nov</strong></span>
          <span className="mx-1.5">•</span>
          <span>{metrics.workingDaysUntilMT2} Working Days Remaining</span>
        </div>
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
        {CALENDAR_DAYS_UNTIL_MT2.map((day, idx) => {
          let badge = `${day.classesScheduled} lecs`;
          let cardBg = "bg-zinc-900 border-zinc-800 text-zinc-300";

          if (day.isExamDay) {
            badge = "MT2 Exam";
            cardBg = "bg-rose-950/20 border-rose-900/40 text-rose-300";
          } else if (day.isHoliday) {
            badge = day.holidayReason || "Holiday";
            cardBg = "bg-amber-950/15 border-amber-900/30 text-amber-300";
          } else if (day.dayName.includes("Today")) {
            badge = "Today";
            cardBg = "bg-zinc-800/80 border-zinc-700 text-white";
          }

          return (
            <div key={idx} className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${cardBg}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{day.dateStr}</span>
                <span className="text-[10px] font-mono text-zinc-400">{badge}</span>
              </div>
              <span className="text-[11px] text-zinc-400">{day.dayName}</span>
            </div>
          );
        })}
      </div>

      {/* Target summary */}
      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-zinc-300">
        <span>
          Remaining before MT2: ≈ <strong>{metrics.totalLecturesUntilMT2} lectures</strong> across 5 full days + today.
        </span>
        <span className="font-medium text-white">
          Target: Attend at least <strong className="text-emerald-400">{metrics.minClassesToAttendBeforeMT2}</strong> classes to stay ≥75%
        </span>
      </div>
    </div>
  );
};
