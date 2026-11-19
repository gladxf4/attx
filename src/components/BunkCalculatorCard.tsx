"use client";

import React, { useState } from "react";
import { BedDouble, ShieldCheck, AlertCircle } from "lucide-react";
import { AttendanceMetrics } from "@/lib/types";

interface BunkCalculatorCardProps {
  metrics: AttendanceMetrics;
}

export const BunkCalculatorCard: React.FC<BunkCalculatorCardProps> = ({ metrics }) => {
  const [bunkInput, setBunkInput] = useState<number>(0);

  const simulatedHeld = metrics.currentTotalHeld + bunkInput;
  const simulatedPresent = metrics.currentTotalPresent;
  const simulatedPercentage = simulatedHeld > 0 ? (simulatedPresent / simulatedHeld) * 100 : 0;
  const simulatedEligible = simulatedPercentage >= metrics.targetPercentage;

  return (
    <div className="clean-card p-6 sm:p-7">
      <div className="flex items-center space-x-2 mb-5">
        <BedDouble className="h-4 w-4 text-zinc-400" />
        <h2 className="text-sm font-semibold text-white">Safe Bunk Calculator</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <span className="text-xs text-zinc-400 block mb-1">Consecutive Bunks Allowed</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono text-white">
              {metrics.safeBunksRemaining}
            </span>
            <span className="text-xs text-zinc-400">classes</span>
          </div>
          <span className="text-xs text-zinc-400 block mt-1">
            ≈ {metrics.safeDaysBunkable} full college days (8 lecs/day)
          </span>
        </div>

        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <span className="text-xs text-zinc-400 block mb-1">MT2 Eligibility Status</span>
          <div className="mt-1">
            {metrics.isEligibleForMT2 ? (
              <span className="text-sm font-semibold text-emerald-400 flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Cleared for Midterms</span>
              </span>
            ) : (
              <span className="text-sm font-semibold text-rose-400 flex items-center space-x-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>Need {metrics.classesNeededFor75} Consecutive Classes</span>
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-400 block mt-1">
            {metrics.isEligibleForMT2
              ? "Safe above 75% requirement."
              : `Attend next ${metrics.classesNeededFor75} lectures to hit 75%.`}
          </span>
        </div>
      </div>

      {/* Simulator Slider */}
      <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
        <div className="flex items-center justify-between text-xs text-zinc-300 mb-2">
          <span>What if I bunk classes?</span>
          <span className="font-mono text-zinc-400">+{bunkInput} lectures</span>
        </div>

        <input
          type="range"
          min="0"
          max={Math.max(30, metrics.safeBunksRemaining + 10)}
          value={bunkInput}
          onChange={(e) => setBunkInput(Number(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-white"
        />

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-zinc-400">New Attendance:</span>
          <div className="flex items-center space-x-2">
            <span
              className={`font-mono font-bold ${
                simulatedEligible ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {simulatedPercentage.toFixed(2)}%
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                simulatedEligible
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-rose-500/10 text-rose-400"
              }`}
            >
              {simulatedEligible ? "Eligible" : "Below 75%"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
