"use client";

import React from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { AttendanceMetrics } from "@/lib/types";

interface AttendanceHeroProps {
  metrics: AttendanceMetrics;
}

export const AttendanceHero: React.FC<AttendanceHeroProps> = ({ metrics }) => {
  return (
    <div className="clean-card p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-zinc-800">
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
                  <span>Below 75% Target</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-5xl sm:text-6xl font-bold font-mono tracking-tight text-white">
              {metrics.currentPercentage}%
            </span>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-300 font-medium">Official Attendance</span>
              <span className="text-[11px] text-zinc-500 font-mono">Raw academic: {metrics.rawPercentage}%</span>
            </div>
          </div>
        </div>

        {/* Comparison Pills */}
        <div className="flex flex-col sm:items-end text-xs text-zinc-400 space-y-1">
          <div className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-zinc-300">
            Baseline: <span className="text-white font-semibold">{metrics.wednesdayPercentage}%</span> ({metrics.baselineRelativeText})
          </div>
          <div className="text-[11px] text-zinc-400">
            Today: <span className="text-zinc-200 font-medium">{metrics.thursdayHeld} held</span>, <span className="text-emerald-400 font-medium">{metrics.thursdayPresent} attended</span>
          </div>
        </div>
      </div>

      {/* Quote & College Note */}
      <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-zinc-400">
        <p className="text-zinc-300 italic">
          "{metrics.goofyQuote}"
        </p>
        <span className="text-[11px] text-zinc-500 shrink-0">
          College uses official higher % for exam eligibility
        </span>
      </div>
    </div>
  );
};
