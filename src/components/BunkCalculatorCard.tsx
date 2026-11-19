"use client";

import React, { useState } from "react";
import { BedDouble, Calendar, ArrowRight, ShieldCheck, AlertCircle, HelpCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { AttendanceMetrics } from "@/lib/types";

interface BunkCalculatorCardProps {
  metrics: AttendanceMetrics;
}

export const BunkCalculatorCard: React.FC<BunkCalculatorCardProps> = ({ metrics }) => {
  const [bunkInput, setBunkInput] = useState<number>(0);

  // Live simulation of bunking 'bunkInput' classes
  const simulatedHeld = metrics.currentTotalHeld + bunkInput;
  const simulatedPresent = metrics.currentTotalPresent; // 0 attended out of bunkInput
  const simulatedPercentage = simulatedHeld > 0 ? (simulatedPresent / simulatedHeld) * 100 : 0;
  const simulatedEligible = simulatedPercentage >= metrics.targetPercentage;

  const triggerCelebration = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#6366f1", "#06b6d4", "#10b981"],
    });
  };

  return (
    <div className="rounded-2xl glass-card p-6 sm:p-7 border border-slate-800">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BedDouble className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Safe Bunk Meter</h2>
            <p className="text-xs text-slate-400">Calculated for 75% Midterm 2 requirement</p>
          </div>
        </div>

        {metrics.isEligibleForMT2 && (
          <button
            onClick={triggerCelebration}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center space-x-1"
          >
            <span>Eligible! 🎉</span>
          </button>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Safe Bunks Card */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Consecutive Safe Bunks
          </span>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-indigo-400">
              {metrics.safeBunksRemaining}
            </span>
            <span className="text-sm font-medium text-slate-300">lectures</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Equivalent to ≈ <strong className="text-slate-200">{metrics.safeDaysBunkable} full days</strong> (8 periods/day)
          </p>
        </div>

        {/* Action / Recovery Card */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            MT2 Exam Eligibility Status
          </span>
          <div className="mt-1">
            {metrics.isEligibleForMT2 ? (
              <div className="flex items-center space-x-2 text-emerald-400">
                <ShieldCheck className="h-6 w-6 shrink-0" />
                <span className="text-lg font-bold">Cleared for MT2</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-rose-400">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <span className="text-lg font-bold">Needs {metrics.classesNeededFor75} Classes</span>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {metrics.isEligibleForMT2
              ? "You can afford to skip classes without losing MT2 hall ticket."
              : `Attend the next ${metrics.classesNeededFor75} lectures consecutively to reach 75%.`}
          </p>
        </div>
      </div>

      {/* Interactive What-If Simulator Slider */}
      <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-r from-slate-900/80 to-indigo-950/20 p-4 sm:p-5">
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="font-semibold text-slate-200">
            Live Bunk Simulator: What if I skip classes?
          </span>
          <span className="font-mono text-indigo-300 font-bold">
            +{bunkInput} lectures skipped
          </span>
        </div>

        <input
          type="range"
          min="0"
          max={Math.max(30, metrics.safeBunksRemaining + 10)}
          value={bunkInput}
          onChange={(e) => setBunkInput(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-400">Resulting Attendance:</span>
          <div className="flex items-center space-x-2">
            <span
              className={`font-bold font-mono text-sm ${
                simulatedEligible ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {simulatedPercentage.toFixed(2)}%
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                simulatedEligible
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
              }`}
            >
              {simulatedEligible ? "Safe (≥75%)" : "Debarred (<75%)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
