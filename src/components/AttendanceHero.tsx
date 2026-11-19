"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  RotateCw,
  SlidersHorizontal,
  Clock,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
      ? `${safeDays} day${safeDays !== 1 ? "s" : ""}${
          safeLecsRemainder > 0 ? ` + ${safeLecsRemainder} lecs` : ""
        }`
      : `${metrics.safeBunksRemaining} lecs`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="apple-card p-6 sm:p-7 relative overflow-hidden"
    >
      {/* Uninitialized ERP Banner */}
      {!hasERPInitialized && metrics.wednesdayHeld === 0 && (
        <div className="mb-5 p-3.5 rounded-xl bg-zinc-900/90 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <RotateCw className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Connect college ERP to fetch verified attendance and real timetables.</span>
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

      {/* Top Meta Status Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Eligibility Indicator */}
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                metrics.isEligibleForMT2 ? "bg-emerald-400" : "bg-rose-400 animate-pulse"
              }`}
            />
            <span className="font-medium text-zinc-300">
              {metrics.isEligibleForMT2
                ? `Eligible for Midterms (≥${targetPct}%)`
                : `Action Required (<${targetPct}%)`}
            </span>
          </div>

          {/* Interactive Target Threshold Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTargetPicker(!showTargetPicker)}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.14] text-xs font-medium text-zinc-300 hover:text-white transition apple-interactive"
            >
              <SlidersHorizontal className="h-3 w-3 text-zinc-400" />
              <span>Target: {targetPct}%</span>
              <ChevronDown className="h-3 w-3 text-zinc-500" />
            </button>

            <AnimatePresence>
              {showTargetPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 z-40 w-56 p-3 rounded-2xl bg-[#11121a] border border-white/[0.12] shadow-2xl backdrop-blur-2xl space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-300 font-medium border-b border-white/[0.06] pb-1.5">
                    <span>Target Attendance</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Min 75%</span>
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
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-zinc-800 accent-white"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Today's Marked Tracker Link */}
          {onOpenTodayDetailModal && (
            <button
              type="button"
              onClick={onOpenTodayDetailModal}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.14] text-xs font-medium text-zinc-300 hover:text-white transition group apple-interactive"
              title="Click to view and mark today's periods"
            >
              <Clock className="h-3 w-3 text-zinc-400 group-hover:text-zinc-200" />
              <span>Today: {metrics.thursdayHeld}/8 marked</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Stats Row */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 pt-6 pb-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium block mb-1">
            Overall Attendance
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-6xl sm:text-7xl font-extrabold font-mono tracking-tight text-white">
              {metrics.currentPercentage}%
            </span>
          </div>
          <span className="text-xs text-zinc-400 block mt-1.5">
            Evaluated against the 30 November cutoff
          </span>
        </div>

        {/* Safe Bunks / Classes Needed Card */}
        <div className="self-start sm:self-auto">
          {metrics.isEligibleForMT2 ? (
            <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/[0.08] text-right min-w-[170px]">
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium block">
                Safe Bunks
              </span>
              <span className="text-3xl font-extrabold font-mono text-emerald-400 block mt-0.5">
                +{metrics.safeBunksRemaining}
              </span>
              <span className="text-[11px] text-zinc-400 font-mono block mt-1">
                {safeText}
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-right min-w-[170px]">
              <span className="text-[11px] text-rose-300 uppercase tracking-wider font-medium block">
                Classes Needed
              </span>
              <span className="text-3xl font-extrabold font-mono text-rose-400 block mt-0.5">
                {metrics.classesNeededFor75}
              </span>
              <span className="text-[11px] text-rose-300/80 block mt-1">
                Consecutive to hit {targetPct}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Clean Footnote */}
      <div className="pt-3.5 border-t border-white/[0.06] text-[11px] text-zinc-500 flex items-center justify-between">
        <span>Cutoff: 30 November (MT2 Exams)</span>
        <span className="font-mono text-zinc-400">
          Threshold: {targetPct}%
        </span>
      </div>
    </motion.div>
  );
};
