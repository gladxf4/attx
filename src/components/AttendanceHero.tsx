"use client";

import React from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { AttendanceMetrics } from "@/lib/types";

interface AttendanceHeroProps {
  metrics: AttendanceMetrics;
}

export const AttendanceHero: React.FC<AttendanceHeroProps> = ({ metrics }) => {
  return (
    <div className="clean-card p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span
              className={`inline-flex items-center space-x-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                metrics.isEligibleForMT2
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              {metrics.isEligibleForMT2 ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>MT2 Eligible (≥75%)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Below 75% Threshold</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-5xl sm:text-6xl font-bold tracking-tight text-white font-mono">
              {metrics.currentPercentage}%
            </span>
            <span className="text-xs text-zinc-400 font-medium">Official Attendance</span>
          </div>
        </div>

        {/* Wednesday Comparison Pill */}
        <div className="flex flex-col sm:items-end text-xs text-zinc-400 space-y-1">
          <div className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-zinc-300">
            Wednesday Baseline: <span className="text-white font-semibold">{metrics.wednesdayPercentage}%</span>
          </div>
          <div className="text-[11px] text-zinc-400">
            Today (Thursday): <span className="text-emerald-400 font-medium">+{metrics.thursdayHeld} marked</span> ({metrics.thursdayPresent} Present)
          </div>
        </div>
      </div>

      {/* Quote line */}
      <div className="pt-4 flex items-center justify-between text-xs">
        <p className="text-zinc-300 italic">
          "{metrics.goofyQuote}"
        </p>
      </div>
    </div>
  );
};
