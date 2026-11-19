"use client";

import React, { useState } from "react";
import { Plus, Minus, RotateCcw, ChevronDown, ChevronUp, Beaker, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SubjectRecord } from "@/lib/types";
import { isLabSubject } from "@/lib/attendanceEngine";

interface TodayPeriodTrackerProps {
  subjects: SubjectRecord[];
  onUpdateSubjects: (updated: SubjectRecord[]) => void;
  onUpdateTodayTotals?: (held: number, present: number) => void;
}

export const TodayPeriodTracker: React.FC<TodayPeriodTrackerProps> = ({
  subjects,
  onUpdateSubjects,
}) => {
  // Collapsed by default as requested
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [filter, setFilter] = useState<"all" | "labs" | "lectures">("all");

  // Determine whether a subject is a lab or lecture using university code and name rules
  const isLabCourse = (s: SubjectRecord) => {
    if (isLabSubject(s.code, s.name)) return true;
    if (s.isLab !== undefined) return s.isLab;
    return false;
  };

  const totalHeldToday = subjects.reduce((acc, s) => acc + (s.todayHeld || 0), 0);
  const totalPresentToday = subjects.reduce((acc, s) => acc + (s.todayPresent || 0), 0);
  const totalAbsentToday = Math.max(0, totalHeldToday - totalPresentToday);
  const remainingPeriods = Math.max(0, 8 - totalHeldToday);

  const updateSubjectPeriods = (
    code: string,
    deltaHeld: number,
    deltaPresent: number
  ) => {
    const updated = subjects.map((s) => {
      if (s.code !== code) return s;

      const currentHeld = s.todayHeld || 0;
      const currentPres = s.todayPresent || 0;

      const maxPossibleHeld = currentHeld + remainingPeriods;
      const newHeld = Math.max(0, Math.min(maxPossibleHeld, currentHeld + deltaHeld));
      const newPres = Math.max(0, Math.min(newHeld, currentPres + deltaPresent));

      return {
        ...s,
        todayHeld: newHeld,
        todayPresent: newPres,
      };
    });

    onUpdateSubjects(updated);
  };

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

  const handleResetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = subjects.map((s) => ({
      ...s,
      todayHeld: 0,
      todayPresent: 0,
    }));
    onUpdateSubjects(updated);
  };

  const filteredSubjects = subjects.filter((s) => {
    const isLab = isLabCourse(s);
    if (filter === "labs") return isLab;
    if (filter === "lectures") return !isLab;
    return true;
  });

  return (
    <div className="apple-card overflow-hidden">
      {/* Clickable Header Bar (Always Visible) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer select-none hover:bg-white/[0.02] transition"
      >
        <div className="flex items-center space-x-3.5">
          <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white">Today's Period Marking</h3>
              <span className="text-[11px] font-mono text-zinc-400">
                Thu, 19 Nov
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {totalHeldToday === 0
                ? "Mark periods attended today (max 8 per day)"
                : `${totalHeldToday} of 8 periods marked · ${totalPresentToday} attended`}
            </p>
          </div>
        </div>

        {/* Status Indicators & Collapse Chevron */}
        <div className="flex items-center space-x-3 self-end sm:self-auto">
          {/* Visual 8-slot meter */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: 8 }).map((_, i) => {
              let dotBg = "bg-zinc-800";
              if (i < totalPresentToday) {
                dotBg = "bg-emerald-400";
              } else if (i < totalHeldToday) {
                dotBg = "bg-rose-400";
              }
              return (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors duration-200 ${dotBg}`}
                />
              );
            })}
          </div>

          {totalHeldToday > 0 && (
            <button
              type="button"
              onClick={handleResetToday}
              className="text-[11px] text-zinc-400 hover:text-rose-400 flex items-center space-x-1 p-1 transition"
              title="Reset all today's entries"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}

          <div className="text-zinc-400 p-1">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-white/[0.06] p-5 sm:p-6 space-y-4"
          >
            {/* Filter Tabs */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center space-x-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filter === "all"
                      ? "bg-zinc-800 text-white font-medium"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  All ({subjects.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("labs")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filter === "labs"
                      ? "bg-purple-950/40 text-purple-300 font-medium border border-purple-800/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Labs & Workshops
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("lectures")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filter === "lectures"
                      ? "bg-blue-950/40 text-blue-300 font-medium border border-blue-800/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Lectures
                </button>
              </div>

              <span className="text-[11px] text-zinc-500 font-mono">
                {remainingPeriods} slot{remainingPeriods !== 1 ? "s" : ""} left today
              </span>
            </div>

            {/* Subject Period List */}
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {filteredSubjects.map((s) => {
                const isLab = isLabCourse(s);
                const currentHeld = s.todayHeld || 0;
                const currentPres = s.todayPresent || 0;
                const currentAbs = Math.max(0, currentHeld - currentPres);

                return (
                  <div
                    key={s.code}
                    className={`p-3 rounded-xl border transition ${
                      currentHeld > 0
                        ? "bg-zinc-900/80 border-white/[0.12]"
                        : "bg-zinc-900/40 border-white/[0.05] hover:border-white/[0.09]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                      {/* Course Info without ugly pill boxes */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => toggleSubjectType(s.code)}
                            className="flex items-center space-x-1.5 text-left text-xs font-medium text-white truncate hover:text-zinc-300 transition"
                            title="Click to toggle Lab vs Lecture"
                          >
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                isLab ? "bg-purple-400" : "bg-blue-400"
                              }`}
                            />
                            <span className="truncate">{s.name}</span>
                          </button>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {isLab ? "Lab" : "Lec"}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          {s.code}
                        </div>
                      </div>

                      {/* Period Steppers */}
                      <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
                        {/* Held Periods Stepper */}
                        <div className="flex items-center space-x-1.5 bg-[#090a0f] border border-white/[0.08] rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateSubjectPeriods(
                                s.code,
                                -1,
                                currentPres > currentHeld - 1 ? -1 : 0
                              )
                            }
                            disabled={currentHeld <= 0}
                            className="h-6 w-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-25 flex items-center justify-center transition"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-mono text-xs font-semibold text-white w-6 text-center">
                            {currentHeld}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateSubjectPeriods(s.code, 1, 1)}
                            disabled={remainingPeriods <= 0}
                            className="h-6 w-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-25 flex items-center justify-center transition"
                            title={
                              remainingPeriods <= 0 ? "Daily 8 limit reached" : "Add period"
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Attended Stepper */}
                        {currentHeld > 0 && (
                          <div className="flex items-center space-x-1.5 bg-[#090a0f] border border-white/[0.08] rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => updateSubjectPeriods(s.code, 0, -1)}
                              disabled={currentPres <= 0}
                              className="h-6 w-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-25 flex items-center justify-center transition"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-mono text-xs font-semibold text-emerald-400 w-6 text-center">
                              {currentPres}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateSubjectPeriods(s.code, 0, 1)}
                              disabled={currentPres >= currentHeld}
                              className="h-6 w-6 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-25 flex items-center justify-center transition"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        {/* Status preview */}
                        {currentHeld > 0 && (
                          <div className="text-right text-[11px] font-mono min-w-[54px]">
                            {currentAbs > 0 ? (
                              <span className="text-rose-400 font-medium">
                                {currentAbs} bunked
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-medium">
                                100% att.
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
