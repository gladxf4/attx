"use client";

import React, { useState } from "react";
import { BedDouble, ShieldCheck, AlertCircle, Calendar, Minus, Plus } from "lucide-react";
import { AttendanceMetrics } from "@/lib/types";

interface BunkCalculatorCardProps {
  metrics: AttendanceMetrics;
}

interface BunkScenario {
  label: string;
  sublabel: string;
  bunks: number;
  resultingPct: number;
  isSafe: boolean;
  isMaxSafe?: boolean;
  isFirstDebarred?: boolean;
}

export const BunkCalculatorCard: React.FC<BunkCalculatorCardProps> = ({ metrics }) => {
  const [bunkInput, setBunkInput] = useState<number>(0);

  const calcPercentage = (bunks: number) => {
    const simHeld = metrics.currentTotalHeld + bunks;
    return simHeld > 0 ? (metrics.currentTotalPresent / simHeld) * 100 : 0;
  };

  const simulatedHeld = metrics.currentTotalHeld + bunkInput;
  const simulatedPresent = metrics.currentTotalPresent;
  const simulatedPercentage = simulatedHeld > 0 ? (simulatedPresent / simulatedHeld) * 100 : 0;
  const simulatedEligible = simulatedPercentage >= metrics.targetPercentage;

  const maxSlider = Math.max(32, metrics.safeBunksRemaining + 8);
  const fillPct = Math.min(100, Math.max(0, (bunkInput / maxSlider) * 100));

  // Build real-world scenarios table
  const scenarios: BunkScenario[] = [];

  // Scenario 0: No bunks
  scenarios.push({
    label: "0 lectures",
    sublabel: "Attend all remaining",
    bunks: 0,
    resultingPct: metrics.currentPercentage,
    isSafe: metrics.isEligibleForMT2,
  });

  if (metrics.safeBunksRemaining > 0) {
    // 4 lectures (half day)
    if (metrics.safeBunksRemaining >= 4) {
      scenarios.push({
        label: "4 lectures",
        sublabel: "Half day bunk",
        bunks: 4,
        resultingPct: Number(calcPercentage(4).toFixed(2)),
        isSafe: true,
      });
    }

    // 8 lectures (1 full day)
    if (metrics.safeBunksRemaining >= 8) {
      scenarios.push({
        label: "8 lectures",
        sublabel: "1 full college day",
        bunks: 8,
        resultingPct: Number(calcPercentage(8).toFixed(2)),
        isSafe: true,
      });
    }

    // 16 lectures (2 full days)
    if (metrics.safeBunksRemaining >= 16) {
      scenarios.push({
        label: "16 lectures",
        sublabel: "2 full college days",
        bunks: 16,
        resultingPct: Number(calcPercentage(16).toFixed(2)),
        isSafe: true,
      });
    }

    // Max safe bunks threshold
    const maxSafeDays = Math.floor(metrics.safeBunksRemaining / 8);
    const maxSafeRemainder = metrics.safeBunksRemaining % 8;
    const maxSafeDayText =
      maxSafeDays > 0
        ? `${maxSafeDays}d ${maxSafeRemainder > 0 ? `${maxSafeRemainder}l` : ""}`.trim()
        : `${metrics.safeBunksRemaining} lectures`;

    scenarios.push({
      label: `${metrics.safeBunksRemaining} lectures`,
      sublabel: `Max Safe Limit (≈ ${maxSafeDayText})`,
      bunks: metrics.safeBunksRemaining,
      resultingPct: Number(calcPercentage(metrics.safeBunksRemaining).toFixed(2)),
      isSafe: true,
      isMaxSafe: true,
    });

    // First debarred class
    const debarBunk = metrics.safeBunksRemaining + 1;
    scenarios.push({
      label: `${debarBunk} lectures`,
      sublabel: "First Debarred Class (< 75%)",
      bunks: debarBunk,
      resultingPct: Number(calcPercentage(debarBunk).toFixed(2)),
      isSafe: false,
      isFirstDebarred: true,
    });

    // 24 lectures (3 full days) if beyond safe bunks
    if (24 > metrics.safeBunksRemaining && 24 !== debarBunk) {
      scenarios.push({
        label: "24 lectures",
        sublabel: "3 full college days",
        bunks: 24,
        resultingPct: Number(calcPercentage(24).toFixed(2)),
        isSafe: false,
      });
    }
  } else {
    // Already below 75%
    scenarios.push({
      label: "4 lectures",
      sublabel: "Half day bunk",
      bunks: 4,
      resultingPct: Number(calcPercentage(4).toFixed(2)),
      isSafe: false,
    });
    scenarios.push({
      label: "8 lectures",
      sublabel: "1 full college day",
      bunks: 8,
      resultingPct: Number(calcPercentage(8).toFixed(2)),
      isSafe: false,
    });
  }

  return (
    <div className="clean-card p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center space-x-2">
          <BedDouble className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-white">Safe Bunk Calculator</h2>
        </div>
        <span className="text-xs text-zinc-400">8 lectures / day</span>
      </div>

      {/* Top 2 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <span className="text-xs text-zinc-400 block mb-1">Consecutive Bunks Allowed</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold font-mono text-white">
              {metrics.safeBunksRemaining}
            </span>
            <span className="text-xs text-zinc-400">classes</span>
          </div>
          <span className="text-xs text-zinc-400 block mt-1">
            ≈ {metrics.safeDaysBunkable} full days {metrics.safeBunksRemaining % 8 > 0 ? `& ${metrics.safeBunksRemaining % 8} lectures` : ""}
          </span>
        </div>

        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <span className="text-xs text-zinc-400 block mb-1">MT2 Eligibility Status</span>
          <div className="mt-1">
            {metrics.isEligibleForMT2 ? (
              <span className="text-sm font-semibold text-emerald-400 flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Cleared for Midterms</span>
              </span>
            ) : (
              <span className="text-sm font-semibold text-rose-400 flex items-center space-x-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Need {metrics.classesNeededFor75} Consecutive Classes</span>
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-400 block mt-1">
            {metrics.isEligibleForMT2
              ? `Safe above ${metrics.targetPercentage}% requirement.`
              : `Attend next ${metrics.classesNeededFor75} lectures to hit ${metrics.targetPercentage}%.`}
          </span>
        </div>
      </div>

      {/* Informative Bunk Impact Matrix / Breakdown Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-200">Attendance by Bunk Count</span>
          <span className="text-[11px] text-zinc-500">Tap any scenario to simulate</span>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="divide-y divide-zinc-800/80 text-xs">
            {scenarios.map((sc, idx) => {
              const isSelected = bunkInput === sc.bunks;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setBunkInput(sc.bunks)}
                  className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition ${
                    isSelected
                      ? "bg-zinc-800/90 text-white"
                      : "hover:bg-zinc-800/40 text-zinc-300"
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium font-mono text-white text-xs">{sc.label}</span>
                      {sc.isMaxSafe && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
                          Last Safe Bunk
                        </span>
                      )}
                      {sc.isFirstDebarred && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 font-medium border border-rose-500/20">
                          Debarred
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500">{sc.sublabel}</span>
                  </div>

                  <div className="flex items-center space-x-2.5 text-right">
                    <span
                      className={`font-mono font-bold text-xs ${
                        sc.resultingPct >= metrics.targetPercentage
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {sc.resultingPct.toFixed(2)}%
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        sc.resultingPct >= metrics.targetPercentage
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {sc.resultingPct >= metrics.targetPercentage ? "Eligible" : "Below 75%"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Simulator with Preset Pills and Smooth Track Fill */}
      <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-200 font-medium">Custom Simulator</span>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setBunkInput((prev) => Math.max(0, prev - 1))}
              disabled={bunkInput <= 0}
              className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 flex items-center justify-center transition"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="font-mono text-xs font-bold text-white px-2">
              +{bunkInput} {bunkInput === 1 ? "lecture" : "lectures"}
            </span>
            <button
              type="button"
              onClick={() => setBunkInput((prev) => prev + 1)}
              className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setBunkInput(0)}
            className={`text-[11px] px-2 py-1 rounded border transition ${
              bunkInput === 0
                ? "bg-white text-zinc-950 border-white font-medium"
                : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
            }`}
          >
            0
          </button>
          {metrics.safeBunksRemaining >= 4 && (
            <button
              type="button"
              onClick={() => setBunkInput(4)}
              className={`text-[11px] px-2 py-1 rounded border transition ${
                bunkInput === 4
                  ? "bg-white text-zinc-950 border-white font-medium"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              +4 (Half Day)
            </button>
          )}
          {metrics.safeBunksRemaining >= 8 && (
            <button
              type="button"
              onClick={() => setBunkInput(8)}
              className={`text-[11px] px-2 py-1 rounded border transition ${
                bunkInput === 8
                  ? "bg-white text-zinc-950 border-white font-medium"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              +8 (1 Day)
            </button>
          )}
          {metrics.safeBunksRemaining >= 16 && (
            <button
              type="button"
              onClick={() => setBunkInput(16)}
              className={`text-[11px] px-2 py-1 rounded border transition ${
                bunkInput === 16
                  ? "bg-white text-zinc-950 border-white font-medium"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              +16 (2 Days)
            </button>
          )}
          {metrics.safeBunksRemaining > 0 && (
            <button
              type="button"
              onClick={() => setBunkInput(metrics.safeBunksRemaining)}
              className={`text-[11px] px-2 py-1 rounded border transition ${
                bunkInput === metrics.safeBunksRemaining
                  ? "bg-white text-zinc-950 border-white font-medium"
                  : "bg-zinc-950 text-amber-400 border-zinc-800 hover:text-white"
              }`}
            >
              Max Safe (+{metrics.safeBunksRemaining})
            </button>
          )}
        </div>

        {/* Filled Slider Track */}
        <input
          type="range"
          min="0"
          max={maxSlider}
          value={bunkInput}
          onChange={(e) => setBunkInput(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, #ffffff ${fillPct}%, #27272a ${fillPct}%)`,
          }}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-white"
        />

        <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80">
          <span className="text-zinc-400">Resulting Attendance:</span>
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
