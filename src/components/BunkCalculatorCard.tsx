"use client";

import React, { useState } from "react";
import {
  BedDouble,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Minus,
  Plus,
  TrendingUp,
  Sparkles,
  Target,
  ArrowRight,
  Info
} from "lucide-react";
import { AttendanceMetrics } from "@/lib/types";

interface BunkCalculatorCardProps {
  metrics: AttendanceMetrics;
  onUpdateTarget?: (target: number) => void;
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

export const BunkCalculatorCard: React.FC<BunkCalculatorCardProps> = ({
  metrics,
  onUpdateTarget,
}) => {
  const [mode, setMode] = useState<"bunk" | "attend">("bunk");
  const [bunkInput, setBunkInput] = useState<number>(0);
  const [attendInput, setAttendInput] = useState<number>(0);

  const targetPercentage = metrics.targetPercentage || 75;

  // Bunk calculation
  const calcBunkPercentage = (bunks: number) => {
    const simHeld = metrics.currentTotalHeld + bunks;
    return simHeld > 0 ? (metrics.currentTotalPresent / simHeld) * 100 : 0;
  };

  const simulatedBunkHeld = metrics.currentTotalHeld + bunkInput;
  const simulatedBunkPresent = metrics.currentTotalPresent;
  const simulatedBunkPercentage =
    simulatedBunkHeld > 0 ? (simulatedBunkPresent / simulatedBunkHeld) * 100 : 0;
  const simulatedBunkEligible = simulatedBunkPercentage >= targetPercentage;

  // Attendance recovery calculation
  const simulatedAttendHeld = metrics.currentTotalHeld + attendInput;
  const simulatedAttendPresent = metrics.currentTotalPresent + attendInput;
  const simulatedAttendPercentage =
    simulatedAttendHeld > 0 ? (simulatedAttendPresent / simulatedAttendHeld) * 100 : 0;
  const simulatedAttendEligible = simulatedAttendPercentage >= targetPercentage;

  const maxSliderBunk = Math.max(32, metrics.safeBunksRemaining + 12);
  const fillPctBunk = Math.min(100, Math.max(0, (bunkInput / maxSliderBunk) * 100));

  const maxSliderAttend = Math.max(40, (metrics.classesNeededFor75 || 0) + 16);
  const fillPctAttend = Math.min(100, Math.max(0, (attendInput / maxSliderAttend) * 100));

  // Build real-world scenarios table
  const scenarios: BunkScenario[] = [];

  // Scenario 0: No bunks
  scenarios.push({
    label: "0 lectures",
    sublabel: "Attend all upcoming classes",
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
        resultingPct: Number(calcBunkPercentage(4).toFixed(2)),
        isSafe: true,
      });
    }

    // 8 lectures (1 full day)
    if (metrics.safeBunksRemaining >= 8) {
      scenarios.push({
        label: "8 lectures",
        sublabel: "1 full working day",
        bunks: 8,
        resultingPct: Number(calcBunkPercentage(8).toFixed(2)),
        isSafe: true,
      });
    }

    // 16 lectures (2 full days)
    if (metrics.safeBunksRemaining >= 16) {
      scenarios.push({
        label: "16 lectures",
        sublabel: "2 full working days",
        bunks: 16,
        resultingPct: Number(calcBunkPercentage(16).toFixed(2)),
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
      resultingPct: Number(calcBunkPercentage(metrics.safeBunksRemaining).toFixed(2)),
      isSafe: true,
      isMaxSafe: true,
    });

    // First debarred class
    const debarBunk = metrics.safeBunksRemaining + 1;
    scenarios.push({
      label: `${debarBunk} lectures`,
      sublabel: `First Debarred Class (< ${targetPercentage}%)`,
      bunks: debarBunk,
      resultingPct: Number(calcBunkPercentage(debarBunk).toFixed(2)),
      isSafe: false,
      isFirstDebarred: true,
    });
  } else {
    // Already below target
    scenarios.push({
      label: "4 lectures",
      sublabel: "Half day bunk",
      bunks: 4,
      resultingPct: Number(calcBunkPercentage(4).toFixed(2)),
      isSafe: false,
    });
    scenarios.push({
      label: "8 lectures",
      sublabel: "1 full day bunk",
      bunks: 8,
      resultingPct: Number(calcBunkPercentage(8).toFixed(2)),
      isSafe: false,
    });
  }

  return (
    <div className="clean-card p-5 sm:p-6 space-y-6 border border-zinc-800/80 bg-zinc-950/70 shadow-lg">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            {mode === "bunk" ? (
              <BedDouble className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingUp className="h-4 w-4 text-blue-400" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Interactive Attendance Simulator</h2>
            <p className="text-xs text-zinc-400">
              {mode === "bunk"
                ? `Simulate how upcoming bunks impact your ${targetPercentage}% eligibility`
                : `Simulate how attending next classes boosts your attendance`}
            </p>
          </div>
        </div>

        {/* Tab switch between Bunk Simulator and Attend Simulator */}
        <div className="flex items-center p-1 bg-zinc-900 rounded-lg border border-zinc-800 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setMode("bunk")}
            className={`px-3 py-1 rounded-md font-medium transition ${
              mode === "bunk"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Simulate Bunks
          </button>
          <button
            type="button"
            onClick={() => setMode("attend")}
            className={`px-3 py-1 rounded-md font-medium transition ${
              mode === "attend"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Simulate Attending
          </button>
        </div>
      </div>

      {/* Top 2 Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs text-zinc-400 block mb-1">Consecutive Bunks Allowed</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {metrics.safeBunksRemaining}
            </span>
            <span className="text-xs text-zinc-400">lectures</span>
          </div>
          <span className="text-xs text-zinc-400 block mt-1.5">
            ≈ {metrics.safeDaysBunkable} full working day{metrics.safeDaysBunkable !== 1 ? "s" : ""}{" "}
            {metrics.safeBunksRemaining % 8 > 0 ? `& ${metrics.safeBunksRemaining % 8} lectures` : ""}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-xs text-zinc-400 block mb-1">MT2 Eligibility Status</span>
          <div className="mt-1">
            {metrics.isEligibleForMT2 ? (
              <span className="text-sm font-semibold text-emerald-400 flex items-center space-x-1.5">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Cleared for Midterms (≥{targetPercentage}%)</span>
              </span>
            ) : (
              <span className="text-sm font-semibold text-rose-400 flex items-center space-x-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Need {metrics.classesNeededFor75} Classes in a Row</span>
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-400 block mt-1.5">
            {metrics.isEligibleForMT2
              ? `You have a cushion of ${metrics.safeBunksRemaining} bunks before dropping below ${targetPercentage}%.`
              : `Attend the next ${metrics.classesNeededFor75} lectures consecutively to hit ${targetPercentage}%.`}
          </span>
        </div>
      </div>

      {/* Mode A: Bunk Simulator Interactive Section */}
      {mode === "bunk" ? (
        <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div>
              <span className="text-zinc-200 font-semibold">Simulate Bunking Future Classes</span>
              <p className="text-[11px] text-zinc-400">Choose or slide how many upcoming periods you plan to skip</p>
            </div>
            <div className="flex items-center space-x-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setBunkInput((prev) => Math.max(0, prev - 1))}
                disabled={bunkInput <= 0}
                className="h-7 w-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-25 flex items-center justify-center transition"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono text-xs font-bold text-white px-2.5">
                +{bunkInput} {bunkInput === 1 ? "lecture" : "lectures"}
              </span>
              <button
                type="button"
                onClick={() => setBunkInput((prev) => prev + 1)}
                className="h-7 w-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setBunkInput(0)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                bunkInput === 0
                  ? "bg-white text-zinc-950 border-white font-semibold"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              0 (Attend All)
            </button>
            {metrics.safeBunksRemaining >= 4 && (
              <button
                type="button"
                onClick={() => setBunkInput(4)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  bunkInput === 4
                    ? "bg-white text-zinc-950 border-white font-semibold"
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
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  bunkInput === 8
                    ? "bg-white text-zinc-950 border-white font-semibold"
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
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  bunkInput === 16
                    ? "bg-white text-zinc-950 border-white font-semibold"
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
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  bunkInput === metrics.safeBunksRemaining
                    ? "bg-amber-400 text-zinc-950 border-amber-400 font-semibold"
                    : "bg-zinc-950 text-amber-300 border-zinc-800 hover:text-white"
                }`}
              >
                Max Safe (+{metrics.safeBunksRemaining})
              </button>
            )}
          </div>

          {/* Filled Slider Track */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max={maxSliderBunk}
              value={bunkInput}
              onChange={(e) => setBunkInput(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, #10b981 ${fillPctBunk}%, #27272a ${fillPctBunk}%)`,
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>0 lecs</span>
              <span>Max Safe: +{metrics.safeBunksRemaining}</span>
              <span>+{maxSliderBunk} lecs</span>
            </div>
          </div>

          {/* Result Card */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400">Simulated Attendance Outcome:</span>
              <span className="text-[11px] text-zinc-500">
                {bunkInput === 0
                  ? "Current official status"
                  : `After bunking next ${bunkInput} class${bunkInput !== 1 ? "es" : ""}`}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-right">
              <span
                className={`text-xl font-bold font-mono ${
                  simulatedBunkEligible ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {simulatedBunkPercentage.toFixed(2)}%
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                  simulatedBunkEligible
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {simulatedBunkEligible ? `Eligible (≥${targetPercentage}%)` : "Debarred"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Mode B: Attend Simulator Interactive Section */
        <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div>
              <span className="text-zinc-200 font-semibold">Simulate Attending Future Classes</span>
              <p className="text-[11px] text-zinc-400">See how your percentage climbs by attending consecutive classes</p>
            </div>
            <div className="flex items-center space-x-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setAttendInput((prev) => Math.max(0, prev - 1))}
                disabled={attendInput <= 0}
                className="h-7 w-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-25 flex items-center justify-center transition"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono text-xs font-bold text-white px-2.5">
                +{attendInput} {attendInput === 1 ? "lecture" : "lectures"}
              </span>
              <button
                type="button"
                onClick={() => setAttendInput((prev) => prev + 1)}
                className="h-7 w-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Presets for Attending */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setAttendInput(0)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                attendInput === 0
                  ? "bg-white text-zinc-950 border-white font-semibold"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setAttendInput(8)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                attendInput === 8
                  ? "bg-white text-zinc-950 border-white font-semibold"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              +8 (1 Full Day)
            </button>
            <button
              type="button"
              onClick={() => setAttendInput(16)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                attendInput === 16
                  ? "bg-white text-zinc-950 border-white font-semibold"
                  : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
              }`}
            >
              +16 (2 Days)
            </button>
            {metrics.classesNeededFor75 > 0 && (
              <button
                type="button"
                onClick={() => setAttendInput(metrics.classesNeededFor75)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                  attendInput === metrics.classesNeededFor75
                    ? "bg-blue-500 text-white border-blue-400 font-semibold"
                    : "bg-zinc-950 text-blue-300 border-zinc-800 hover:text-white"
                }`}
              >
                To Reach {targetPercentage}% (+{metrics.classesNeededFor75})
              </button>
            )}
          </div>

          {/* Slider for Attending */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max={maxSliderAttend}
              value={attendInput}
              onChange={(e) => setAttendInput(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, #3b82f6 ${fillPctAttend}%, #27272a ${fillPctAttend}%)`,
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-400"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>0 lecs</span>
              <span>+{Math.floor(maxSliderAttend / 2)} lecs</span>
              <span>+{maxSliderAttend} lecs</span>
            </div>
          </div>

          {/* Result Card */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-400">Simulated Attendance Outcome:</span>
              <span className="text-[11px] text-zinc-500">
                After attending next {attendInput} consecutive lecture{attendInput !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-right">
              <span
                className={`text-xl font-bold font-mono ${
                  simulatedAttendEligible ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {simulatedAttendPercentage.toFixed(2)}%
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                  simulatedAttendEligible
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {simulatedAttendEligible ? `Eligible (≥${targetPercentage}%)` : "Below Target"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Real-world Scenarios Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-200">Attendance by Bunk Count</span>
          <span className="text-[11px] text-zinc-500">Tap any scenario to test in simulator</span>
        </div>

        <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 overflow-hidden divide-y divide-zinc-800/70">
          {scenarios.map((sc, idx) => {
            const isSelected = bunkInput === sc.bunks && mode === "bunk";
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setMode("bunk");
                  setBunkInput(sc.bunks);
                }}
                className={`w-full px-4 py-3 flex items-center justify-between text-left transition ${
                  isSelected
                    ? "bg-zinc-800/90 text-white"
                    : "hover:bg-zinc-800/40 text-zinc-300"
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold font-mono text-white text-xs">{sc.label}</span>
                    {sc.isMaxSafe && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">
                        Last Safe Bunk
                      </span>
                    )}
                    {sc.isFirstDebarred && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/30">
                        Debarred
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 mt-0.5">{sc.sublabel}</span>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <span
                    className={`font-mono font-bold text-xs ${
                      sc.resultingPct >= targetPercentage
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {sc.resultingPct.toFixed(2)}%
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      sc.resultingPct >= targetPercentage
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {sc.resultingPct >= targetPercentage ? "Eligible" : "Below Target"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};