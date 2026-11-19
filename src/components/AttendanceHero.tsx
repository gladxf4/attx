"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowRight,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { AttendanceMetrics } from "@/lib/types";

interface AttendanceHeroProps {
  metrics: AttendanceMetrics;
  onOpenSync?: () => void;
  onOpenTodayDetailModal?: () => void;
  onUpdateTarget?: (target: number) => void;
  hasERPInitialized?: boolean;
}

export const AttendanceHero: React.FC<AttendanceHeroProps> = ({
  metrics,
  onOpenSync,
  onOpenTodayDetailModal,
  onUpdateTarget,
  hasERPInitialized = false,
}) => {
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const targetPct = metrics.targetPercentage || 75;
  const targetPresets = [75, 80, 85, 90];

  const safeDays = metrics.safeDaysBunkable;
  const safeLecsRemainder = metrics.safeBunksRemaining % 8;
  const safeText =
    safeDays > 0
      ? `${safeDays} full day${safeDays !== 1 ? "s" : ""}${
          safeLecsRemainder > 0 ? ` & ${safeLecsRemainder} lecs` : ""
        }`
      : `${metrics.safeBunksRemaining} lectures`;

  return (
    <div className="apple-card p-6 sm:p-7 relative overflow-hidden transition-all duration-200">
      {/* Uninitialized ERP Notice */}
      {!hasERPInitialized && metrics.wednesdayHeld === 0 && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Connect your college ERP to sync verified attendance and courses.</span>
          </div>
          {onOpenSync && (
            <button
              type="button"
              onClick={onOpenSync}
              className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs flex items-center justify-center space-x-1.5 shrink-0 transition"
            >
              <span>Connect ERP</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Top Meta Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
              metrics.isEligibleForMT2
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            {metrics.isEligibleForMT2 ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Eligible for Midterms (≥{targetPct}%)</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Action Needed (Below {targetPct}%)</span>
              </>
            )}
          </span>

          {/* Interactive Target Threshold Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTargetPicker(!showTargetPicker)}
              className="inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-medium bg-zinc-900/80 border border-white/[0.08] hover:border-white/[0.2] text-zinc-300 hover:text-white transition"
            >
              <span>Threshold: {targetPct}%</span>
              <SlidersHorizontal className="h-2.5 w-2.5 text-zinc-500 ml-0.5" />
            </button>

            {showTargetPicker && (
              <div className="absolute left-0 mt-2 z-40 w-56 p-3 rounded-2xl bg-zinc-950/95 border border-white/[0.12] shadow-2xl backdrop-blur-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-300 font-medium border-b border-white/[0.06] pb-1.5">
                  <span>Target Threshold</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Default: 75%</span>
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
                      className={`py-1 rounded-lg text-xs font-mono font-medium border transition ${
                        targetPct === pct
                          ? "bg-white text-zinc-950 border-white font-bold"
                          : "bg-zinc-900 text-zinc-300 border-white/[0.06] hover:border-white/[0.15]"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Custom</span>
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
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Today's Marked Pill (Clickable to open Today's Detail View) */}
          {onOpenTodayDetailModal && (
            <button
              type="button"
              onClick={onOpenTodayDetailModal}
              className="inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-medium bg-zinc-900/80 border border-white/[0.08] hover:border-white/[0.2] text-zinc-300 hover:text-white transition group"
              title="Click to view and mark today's periods"
            >
              <Clock className="h-3 w-3 text-zinc-400 group-hover:text-zinc-200" />
              <span>Today: {metrics.thursdayHeld}/8 marked</span>
              <ChevronDown className="h-2.5 w-2.5 text-zinc-500 group-hover:text-zinc-300" />
            </button>
          )}
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 pt-5 pb-5">
        <div>
          <span className="text-xs uppercase tracking-wider text-zinc-500 font-semibold block mb-1">
            Overall Attendance
          </span>
          <div className="flex items-baseline space-x-3">
            <span className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight text-white">
              {metrics.currentPercentage}%
            </span>
          </div>
          <span className="text-xs text-zinc-400 font-normal block mt-1">
            Term Standing • Evaluated for Midterm examination eligibility
          </span>
        </div>

        {/* Safe Bunks / Action Needed Metric */}
        <div className="self-start sm:self-auto">
          {metrics.isEligibleForMT2 ? (
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-right min-w-[160px]">
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium block">
                Safe Bunks
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-400 block mt-0.5">
                +{metrics.safeBunksRemaining}
              </span>
              <span className="text-[11px] text-zinc-500 block mt-0.5">
                {safeText}
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-right min-w-[160px]">
              <span className="text-[11px] text-rose-300 uppercase tracking-wider font-medium block">
                Classes Needed
              </span>
              <span className="text-2xl font-bold font-mono text-rose-400 block mt-0.5">
                {metrics.classesNeededFor75}
              </span>
              <span className="text-[11px] text-rose-300/80 block mt-0.5">
                Consecutive to hit {targetPct}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footnote */}
      <div className="pt-3 border-t border-white/[0.06] text-[11px] text-zinc-500 flex items-center justify-between">
        <span>Attendance evaluated at Midterm examination cutoff (30 Nov)</span>
        <span className="font-mono text-zinc-400">
          Threshold: {targetPct}%
        </span>
      </div>
    </div>
  );
};
