"use client";

import React, { useState } from "react";
import {
  BedDouble,
  TrendingUp,
  Minus,
  Plus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
}) => {
  const [mode, setMode] = useState<"bunk" | "attend">("bunk");
  const [bunkInput, setBunkInput] = useState<number>(0);
  const [attendInput, setAttendInput] = useState<number>(0);

  const targetPercentage = metrics.targetPercentage || 75;

  const calcBunkPercentage = (bunks: number) => {
    const simHeld = metrics.currentTotalHeld + bunks;
    return simHeld > 0 ? (metrics.currentTotalPresent / simHeld) * 100 : 0;
  };

  const simulatedBunkHeld = metrics.currentTotalHeld + bunkInput;
  const simulatedBunkPresent = metrics.currentTotalPresent;
  const simulatedBunkPercentage =
    simulatedBunkHeld > 0 ? (simulatedBunkPresent / simulatedBunkHeld) * 100 : 0;
  const simulatedBunkEligible = simulatedBunkPercentage >= targetPercentage;

  const simulatedAttendHeld = metrics.currentTotalHeld + attendInput;
  const simulatedAttendPresent = metrics.currentTotalPresent + attendInput;
  const simulatedAttendPercentage =
    simulatedAttendHeld > 0 ? (simulatedAttendPresent / simulatedAttendHeld) * 100 : 0;
  const simulatedAttendEligible = simulatedAttendPercentage >= targetPercentage;

  const maxSliderBunk = Math.max(32, metrics.safeBunksRemaining + 12);
  const fillPctBunk = Math.min(100, Math.max(0, (bunkInput / maxSliderBunk) * 100));

  const maxSliderAttend = Math.max(40, (metrics.classesNeededFor75 || 0) + 16);
  const fillPctAttend = Math.min(100, Math.max(0, (attendInput / maxSliderAttend) * 100));

  const scenarios: BunkScenario[] = [];

  scenarios.push({
    label: "0 lectures",
    sublabel: "Attend all upcoming classes",
    bunks: 0,
    resultingPct: metrics.currentPercentage,
    isSafe: metrics.isEligibleForMT2,
  });

  if (metrics.safeBunksRemaining > 0) {
    if (metrics.safeBunksRemaining >= 4) {
      scenarios.push({
        label: "4 lectures",
        sublabel: "Half day bunk",
        bunks: 4,
        resultingPct: Number(calcBunkPercentage(4).toFixed(2)),
        isSafe: true,
      });
    }

    if (metrics.safeBunksRemaining >= 8) {
      scenarios.push({
        label: "8 lectures",
        sublabel: "1 full working day",
        bunks: 8,
        resultingPct: Number(calcBunkPercentage(8).toFixed(2)),
        isSafe: true,
      });
    }

    if (metrics.safeBunksRemaining >= 16) {
      scenarios.push({
        label: "16 lectures",
        sublabel: "2 full working days",
        bunks: 16,
        resultingPct: Number(calcBunkPercentage(16).toFixed(2)),
        isSafe: true,
      });
    }

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
    <div className="apple-card p-6 sm:p-7 space-y-6">
      {/* Header & Segmented Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center shrink-0">
            {mode === "bunk" ? (
              <BedDouble className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingUp className="h-4 w-4 text-blue-400" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Attendance Simulator</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {mode === "bunk"
                ? `Simulate future bunks against the ${targetPercentage}% cutoff`
                : `Simulate attending upcoming classes to boost attendance`}
            </p>
          </div>
        </div>

        {/* Apple Segmented Switch */}
        <div className="flex items-center p-1 bg-zinc-900/90 rounded-xl border border-white/[0.08] self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setMode("bunk")}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
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
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              mode === "attend"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Simulate Attending
          </button>
        </div>
      </div>

      {/* Simulator Interactive Panel */}
      <AnimatePresence mode="wait">
        {mode === "bunk" ? (
          <motion.div
            key="bunk-mode"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-white/[0.08] space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div>
                <span className="text-zinc-200 font-medium">Bunk Calculator</span>
                <p className="text-[11px] text-zinc-400">
                  Select or slide the number of upcoming lectures to skip
                </p>
              </div>
              <div className="flex items-center space-x-1.5 bg-[#090a0f] border border-white/[0.08] rounded-xl p-1 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setBunkInput((prev) => Math.max(0, prev - 1))}
                  disabled={bunkInput <= 0}
                  className="h-7 w-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-25 flex items-center justify-center transition"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono text-xs font-semibold text-white px-2.5">
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
                className={`text-xs px-2.5 py-1 rounded-lg transition ${
                  bunkInput === 0
                    ? "bg-white text-zinc-950 font-semibold"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06]"
                }`}
              >
                0 (Attend All)
              </button>
              {metrics.safeBunksRemaining >= 4 && (
                <button
                  type="button"
                  onClick={() => setBunkInput(4)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition ${
                    bunkInput === 4
                      ? "bg-white text-zinc-950 font-semibold"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06]"
                  }`}
                >
                  +4 (Half Day)
                </button>
              )}
              {metrics.safeBunksRemaining >= 8 && (
                <button
                  type="button"
                  onClick={() => setBunkInput(8)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition ${
                    bunkInput === 8
                      ? "bg-white text-zinc-950 font-semibold"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06]"
                  }`}
                >
                  +8 (1 Full Day)
                </button>
              )}
              {metrics.safeBunksRemaining > 0 && (
                <button
                  type="button"
                  onClick={() => setBunkInput(metrics.safeBunksRemaining)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition ${
                    bunkInput === metrics.safeBunksRemaining
                      ? "bg-emerald-400 text-zinc-950 font-semibold"
                      : "bg-zinc-900 text-emerald-400 hover:text-white border border-white/[0.06]"
                  }`}
                >
                  Max Safe (+{metrics.safeBunksRemaining})
                </button>
              )}
            </div>

            {/* Slider */}
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
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>0</span>
                <span>Limit: +{metrics.safeBunksRemaining}</span>
                <span>+{maxSliderBunk}</span>
              </div>
            </div>

            {/* Result Row */}
            <div className="p-3.5 bg-[#090a0f] rounded-xl border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-300 font-medium block">
                  Projected Attendance
                </span>
                <span className="text-[11px] text-zinc-500">
                  {bunkInput === 0
                    ? "Current status"
                    : `After skipping next ${bunkInput} class${bunkInput !== 1 ? "es" : ""}`}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-right">
                <span
                  className={`text-2xl font-bold font-mono ${
                    simulatedBunkEligible ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {simulatedBunkPercentage.toFixed(2)}%
                </span>
                <span
                  className={`text-xs font-medium flex items-center space-x-1 ${
                    simulatedBunkEligible ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {simulatedBunkEligible ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Eligible</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>At Risk</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="attend-mode"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-white/[0.08] space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div>
                <span className="text-zinc-200 font-medium">Recovery Calculator</span>
                <p className="text-[11px] text-zinc-400">
                  Select or slide the number of upcoming lectures to attend consecutively
                </p>
              </div>
              <div className="flex items-center space-x-1.5 bg-[#090a0f] border border-white/[0.08] rounded-xl p-1 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setAttendInput((prev) => Math.max(0, prev - 1))}
                  disabled={attendInput <= 0}
                  className="h-7 w-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-25 flex items-center justify-center transition"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono text-xs font-semibold text-white px-2.5">
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
                className={`text-xs px-2.5 py-1 rounded-lg transition ${
                  attendInput === 0
                    ? "bg-white text-zinc-950 font-semibold"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06]"
                }`}
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setAttendInput(8)}
                className={`text-xs px-2.5 py-1 rounded-lg transition ${
                  attendInput === 8
                    ? "bg-white text-zinc-950 font-semibold"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/[0.06]"
                }`}
              >
                +8 (1 Day)
              </button>
              {metrics.classesNeededFor75 > 0 && (
                <button
                  type="button"
                  onClick={() => setAttendInput(metrics.classesNeededFor75)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition ${
                    attendInput === metrics.classesNeededFor75
                      ? "bg-blue-400 text-zinc-950 font-semibold"
                      : "bg-zinc-900 text-blue-400 hover:text-white border border-white/[0.06]"
                  }`}
                >
                  To Reach {targetPercentage}% (+{metrics.classesNeededFor75})
                </button>
              )}
            </div>

            {/* Slider */}
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
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>0</span>
                <span>Target: +{metrics.classesNeededFor75}</span>
                <span>+{maxSliderAttend}</span>
              </div>
            </div>

            {/* Result Row */}
            <div className="p-3.5 bg-[#090a0f] rounded-xl border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-300 font-medium block">
                  Projected Attendance
                </span>
                <span className="text-[11px] text-zinc-500">
                  After attending next {attendInput} consecutive class{attendInput !== 1 ? "es" : ""}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-right">
                <span
                  className={`text-2xl font-bold font-mono ${
                    simulatedAttendEligible ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {simulatedAttendPercentage.toFixed(2)}%
                </span>
                <span
                  className={`text-xs font-medium flex items-center space-x-1 ${
                    simulatedAttendEligible ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {simulatedAttendEligible ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Eligible</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Below Target</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scenarios Table without goofy badges */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-200">Bunk Impact Reference</span>
          <span className="text-[11px] text-zinc-500">Tap scenario to simulate</span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/30 overflow-hidden divide-y divide-white/[0.06]">
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
                    ? "bg-zinc-800/80 text-white"
                    : "hover:bg-zinc-900/40 text-zinc-300"
                }`}
              >
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold font-mono text-white text-xs">
                      {sc.label}
                    </span>
                    {sc.isMaxSafe && (
                      <span className="text-[10px] text-amber-400 font-mono">
                        (Maximum cushion)
                      </span>
                    )}
                    {sc.isFirstDebarred && (
                      <span className="text-[10px] text-rose-400 font-mono">
                        (First below {targetPercentage}%)
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 mt-0.5">{sc.sublabel}</span>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <span
                    className={`font-mono font-semibold text-xs ${
                      sc.resultingPct >= targetPercentage
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {sc.resultingPct.toFixed(2)}%
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      sc.resultingPct >= targetPercentage ? "bg-emerald-400" : "bg-rose-400"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
