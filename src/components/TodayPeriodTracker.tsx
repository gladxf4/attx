"use client";

import React, { useState } from "react";
import { Plus, Minus, Beaker, BookOpen, RotateCcw, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { SubjectRecord } from "@/lib/types";

interface TodayPeriodTrackerProps {
  subjects: SubjectRecord[];
  onUpdateSubjects: (updated: SubjectRecord[]) => void;
  onUpdateTodayTotals: (held: number, present: number) => void;
}

export const TodayPeriodTracker: React.FC<TodayPeriodTrackerProps> = ({
  subjects,
  onUpdateSubjects,
  onUpdateTodayTotals,
}) => {
  const [filter, setFilter] = useState<"all" | "labs" | "lectures">("all");

  // Determine whether a subject is a lab or lecture
  const isLabCourse = (s: SubjectRecord) => {
    if (s.isLab !== undefined) return s.isLab;
    const lower = (s.name || "").toLowerCase();
    const code = (s.code || "").toLowerCase();
    return (
      lower.includes("lab") ||
      lower.includes("workshop") ||
      lower.includes("cloud") ||
      lower.includes("web design") ||
      lower.includes("employability") ||
      lower.includes("skill") ||
      code.includes("35")
    );
  };

  // Calculate current totals for today across all subjects
  const totalHeldToday = subjects.reduce((acc, s) => acc + (s.todayHeld || 0), 0);
  const totalPresentToday = subjects.reduce((acc, s) => acc + (s.todayPresent || 0), 0);
  const totalAbsentToday = Math.max(0, totalHeldToday - totalPresentToday);
  const remainingPeriods = Math.max(0, 8 - totalHeldToday);

  // Update a single subject's held/present periods for today
  const updateSubjectPeriods = (
    code: string,
    deltaHeld: number,
    deltaPresent: number
  ) => {
    const updated = subjects.map((s) => {
      if (s.code !== code) return s;

      const currentHeld = s.todayHeld || 0;
      const currentPres = s.todayPresent || 0;

      // New held clamped between 0 and remaining capacity
      const maxPossibleHeld = currentHeld + remainingPeriods;
      const newHeld = Math.max(0, Math.min(maxPossibleHeld, currentHeld + deltaHeld));

      // New present clamped between 0 and newHeld
      const newPres = Math.max(0, Math.min(newHeld, currentPres + deltaPresent));

      return {
        ...s,
        todayHeld: newHeld,
        todayPresent: newPres,
      };
    });

    onUpdateSubjects(updated);

    const newTotalHeld = updated.reduce((acc, s) => acc + (s.todayHeld || 0), 0);
    const newTotalPres = updated.reduce((acc, s) => acc + (s.todayPresent || 0), 0);
    onUpdateTodayTotals(newTotalHeld, newTotalPres);
  };

  // Toggle subject classification (Lab vs Lecture)
  const toggleSubjectType = (code: string) => {
    const updated = subjects.map((s) => {
      if (s.code !== code) return s;
      const currentlyLab = isLabCourse(s);
      return {
        ...s,
        isLab: !currentlyLab,
      };
    });
    onUpdateSubjects(updated);
  };

  // Reset all today's entries
  const handleResetToday = () => {
    const updated = subjects.map((s) => ({
      ...s,
      todayHeld: 0,
      todayPresent: 0,
    }));
    onUpdateSubjects(updated);
    onUpdateTodayTotals(0, 0);
  };

  const filteredSubjects = subjects.filter((s) => {
    const isLab = isLabCourse(s);
    if (filter === "labs") return isLab;
    if (filter === "lectures") return !isLab;
    return true;
  });

  return (
    <div className="clean-card p-4 sm:p-5 border border-zinc-800 bg-zinc-950/80 space-y-4">
      {/* Header & Capacity Bar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <span>Today's Period Tracker</span>
              <span className="text-[10px] font-mono font-normal text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                Thu, 19 Nov
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Log today's attended periods before professors submit them on ERP.
            </p>
          </div>

          {totalHeldToday > 0 && (
            <button
              onClick={handleResetToday}
              className="text-[11px] text-zinc-400 hover:text-rose-400 flex items-center space-x-1 transition self-start sm:self-auto"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Clear Today</span>
            </button>
          )}
        </div>

        {/* 8-Period Capacity Meter */}
        <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-200">
              {totalHeldToday} of 8 Periods Logged
            </span>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-emerald-400 font-medium">{totalPresentToday} Attended</span>
              <span className="text-rose-400 font-medium">{totalAbsentToday} Bunked</span>
              <span className="text-zinc-500">{remainingPeriods} Open Slots</span>
            </div>
          </div>

          {/* 8-dot visual slots */}
          <div className="grid grid-cols-8 gap-1.5 h-2">
            {Array.from({ length: 8 }).map((_, i) => {
              let slotColor = "bg-zinc-800";
              if (i < totalPresentToday) {
                slotColor = "bg-emerald-500 shadow-sm shadow-emerald-500/20";
              } else if (i < totalHeldToday) {
                slotColor = "bg-rose-500 shadow-sm shadow-rose-500/20";
              }
              return (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${slotColor}`}
                  title={`Period ${i + 1}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center space-x-1.5 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-md transition ${
              filter === "all"
                ? "bg-zinc-800 text-white font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All Courses ({subjects.length})
          </button>
          <button
            onClick={() => setFilter("labs")}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition ${
              filter === "labs"
                ? "bg-zinc-800 text-purple-300 font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Beaker className="h-3 w-3 text-purple-400" />
            <span>Labs & Workshops</span>
          </button>
          <button
            onClick={() => setFilter("lectures")}
            className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition ${
              filter === "lectures"
                ? "bg-zinc-800 text-blue-300 font-medium"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BookOpen className="h-3 w-3 text-blue-400" />
            <span>Lectures</span>
          </button>
        </div>
      </div>

      {/* Subject Period List */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {filteredSubjects.map((s) => {
          const isLab = isLabCourse(s);
          const currentHeld = s.todayHeld || 0;
          const currentPres = s.todayPresent || 0;
          const currentAbs = Math.max(0, currentHeld - currentPres);

          return (
            <div
              key={s.code}
              className={`p-3 rounded-lg border transition ${
                currentHeld > 0
                  ? "bg-zinc-900 border-zinc-700/80"
                  : "bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700/50"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                {/* Course Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => toggleSubjectType(s.code)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium border transition ${
                        isLab
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-300"
                          : "bg-blue-500/10 border-blue-500/20 text-blue-300"
                      }`}
                      title="Tap to toggle between Lab and Lecture"
                    >
                      {isLab ? "Lab (2 Lec)" : "Lecture"}
                    </button>
                    <span className="text-xs font-medium text-white truncate">
                      {s.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1 text-[11px] text-zinc-500 font-mono">
                    <span>{s.code}</span>
                    <span>•</span>
                    <span>ERP Baseline: {s.pres}/{s.held} ({s.pct}%)</span>
                  </div>
                </div>

                {/* Period Controls */}
                <div className="flex items-center space-x-4 self-end sm:self-auto shrink-0">
                  {/* Held periods stepper */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-zinc-500 mb-0.5">Periods Held</span>
                    <div className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-800 rounded p-1">
                      <button
                        type="button"
                        onClick={() => updateSubjectPeriods(s.code, -1, currentPres > currentHeld - 1 ? -1 : 0)}
                        disabled={currentHeld <= 0}
                        className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-25 flex items-center justify-center transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-xs font-semibold text-white w-5 text-center">
                        {currentHeld}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateSubjectPeriods(s.code, 1, 1)}
                        disabled={remainingPeriods <= 0}
                        className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-25 flex items-center justify-center transition"
                        title={remainingPeriods <= 0 ? "Daily 8 periods limit reached" : "Add period"}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Attended periods stepper */}
                  {currentHeld > 0 && (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-zinc-500 mb-0.5">Attended</span>
                      <div className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-800 rounded p-1">
                        <button
                          type="button"
                          onClick={() => updateSubjectPeriods(s.code, 0, -1)}
                          disabled={currentPres <= 0}
                          className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-25 flex items-center justify-center transition"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-mono text-xs font-semibold text-emerald-400 w-5 text-center">
                          {currentPres}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSubjectPeriods(s.code, 0, 1)}
                          disabled={currentPres >= currentHeld}
                          className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-25 flex items-center justify-center transition"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status pill if logged */}
                  {currentHeld > 0 && (
                    <div className="text-right text-[11px] font-mono min-w-[50px]">
                      {currentAbs > 0 ? (
                        <span className="text-rose-400 font-semibold">{currentAbs} Bunked</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">100% Att.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
