"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Zap,
  ArrowRight,
  Target,
  SlidersHorizontal,
  Clock,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { AttendanceMetrics } from "@/lib/types";

interface AttendanceHeroProps {
  metrics: AttendanceMetrics;
  onOpenSync?: () => void;
  onOpenPeriodTracker?: () => void;
  onUpdateTarget?: (target: number) => void;
  hasERPInitialized?: boolean;
}

export const AttendanceHero: React.FC<AttendanceHeroProps> = ({
  metrics,
  onOpenSync,
  onOpenPeriodTracker,
  onUpdateTarget,
  hasERPInitialized = false,
}) => {
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const targetPct = metrics.targetPercentage || 75;

  const targetPresets = [75, 80, 85, 90];

  return (
    <div className="clean-card relative overflow-hidden p-6 sm:p-7 border border-zinc-800/80 bg-gradient-to-b from-zinc-900/70 to-zinc-950 shadow-xl backdrop-blur-md">
      {/* Background glow orb */}
      <div
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 ${
          metrics.isEligibleForMT2 ? "bg-emerald-500" : "bg-rose-500"
        }`}
      />

      {/* Uninitialized ERP Banner */}
      {!hasERPInitialized && metrics.wednesdayHeld === 0 && (
        <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center space-x-2.5 text-xs text-amber-200">
            <Zap className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />
            <span>
              Your ERP credentials have not been connected yet. Sync directly to pull your verified attendance and subjects.
            </span>
          </div>
          {onOpenSync && (
            <button
              onClick={onOpenSync}
              className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs flex items-center justify-center space-x-1.5 shrink-0 transition shadow-sm font-sans"
            >
              <span>Connect ERP</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Stats Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-zinc-800/80">
        <div>
          {/* Status Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                metrics.isEligibleForMT2
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                  : "bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-sm shadow-rose-500/10"
              }`}
            >
              {metrics.isEligibleForMT2 ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>MT2 Cleared (≥{targetPct}%)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                  <span>Below {targetPct}% Threshold</span>
                </>
              )}
            </span>

            {/* Target Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTargetPicker(!showTargetPicker)}
                className="inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-medium bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white transition shadow-sm"
              >
                <Target className="h-3 w-3 text-emerald-400" />
                <span>Target: {targetPct}%</span>
                <SlidersHorizontal className="h-2.5 w-2.5 text-zinc-500 ml-0.5" />
              </button>

              {/* Target Dropdown / Quick Selector */}
              {showTargetPicker && (
                <div className="absolute left-0 mt-2 z-30 w-56 p-3 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl backdrop-blur-md space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold border-b border-zinc-800 pb-1.5">
                    <span>Set Target Threshold</span>
                    <span className="text-[10px] text-zinc-500 font-normal">MT2 default: 75%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {targetPresets.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          if (onUpdateTarget) onUpdateTarget(pct);
                          setShowTargetPicker(false);
                        }}
                        className={`py-1 rounded text-xs font-mono font-medium border transition ${
                          targetPct === pct
                            ? "bg-emerald-500 text-zinc-950 border-emerald-400 font-bold"
                            : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-zinc-500"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                      <span>Custom Target</span>
                      <span className="font-mono font-bold text-white">{targetPct}%</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="95"
                      value={targetPct}
                      onChange={(e) => {
                        if (onUpdateTarget) onUpdateTarget(Number(e.target.value));
                      }}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-emerald-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Today's Period Pill */}
            {onOpenPeriodTracker && (
              <button
                type="button"
                onClick={onOpenPeriodTracker}
                className="inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-medium bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
              >
                <Clock className="h-3 w-3 text-zinc-400" />
                <span>
                  Today: {metrics.thursdayHeld}/8 logged
                </span>
              </button>
            )}
          </div>

          {/* Primary Percentage Display */}
          <div className="flex items-baseline space-x-4">
            <span className="text-6xl sm:text-7xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm">
              {metrics.currentPercentage}%
            </span>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-300 font-medium tracking-wide">
                Official Consolidated Attendance
              </span>
              <span className="text-[11px] text-zinc-500 font-normal">
                Taken from bottom of college ERP page
              </span>
            </div>
          </div>
        </div>

        {/* Right Metric Stat Pills */}
        <div className="flex flex-row lg:flex-col items-start lg:items-end gap-2.5 text-xs">
          {metrics.isEligibleForMT2 ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center space-x-2.5">
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold font-mono text-base text-white mr-1.5">
                  +{metrics.safeBunksRemaining}
                </span>
                <span className="text-emerald-300 font-medium">Safe Bunks Remaining</span>
                <span className="block text-[11px] text-emerald-400/80">
                  ≈ {metrics.safeDaysBunkable} full day{metrics.safeDaysBunkable !== 1 ? "s" : ""} safe
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center space-x-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold font-mono text-base text-white mr-1.5">
                  {metrics.classesNeededFor75}
                </span>
                <span className="text-rose-300 font-medium">Consecutive Classes Needed</span>
                <span className="block text-[11px] text-rose-400/80">
                  To achieve {targetPct}% eligibility
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informative Sub-footer */}
      <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-zinc-500">
        <span className="flex items-center space-x-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-zinc-400" />
          <span>College strictly validates the consolidated percentage at the bottom of ERP for exam eligibility</span>
        </span>
        <span className="text-[11px] font-mono text-zinc-500">
          Total Held: {metrics.currentTotalHeld} • Attended: {metrics.currentTotalPresent}
        </span>
      </div>
    </div>
  );
};