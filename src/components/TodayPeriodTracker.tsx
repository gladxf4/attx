"use client";

import React, { useState } from "react";
import { Plus, Minus, RotateCcw, ChevronDown, ChevronUp, Beaker, BookOpen, CheckCircle2, XCircle, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SubjectRecord, DatewiseSubjectLog } from "@/lib/types";
import { isLabSubject } from "@/lib/attendanceEngine";

interface TodayPeriodTrackerProps {
  subjects: SubjectRecord[];
  erpTodayLogs?: DatewiseSubjectLog[];
  onUpdateSubjects: (updated: SubjectRecord[]) => void;
}

export const TodayPeriodTracker: React.FC<TodayPeriodTrackerProps> = ({
  subjects,
  erpTodayLogs = [],
  onUpdateSubjects,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [filter, setFilter] = useState<"all" | "labs" | "lectures">("all");
  const [showAllSubjects, setShowAllSubjects] = useState<boolean>(false);

  const isLabCourse = (s: SubjectRecord | { code?: string; name?: string; isLab?: boolean }) => {
    if (isLabSubject(s.code, s.name)) return true;
    if (s.isLab !== undefined) return s.isLab;
    return false;
  };

  // 1. ERP Verified Marking for Today
  const erpMarkedHeld = erpTodayLogs.reduce((acc, l) => acc + (l.held || 1), 0);
  const erpMarkedPresent = erpTodayLogs.reduce(
    (acc, l) => acc + (l.present !== undefined ? l.present : l.status === "P" ? l.held || 1 : 0),
    0
  );
  const erpMarkedCodes = new Set(erpTodayLogs.map((l) => (l.code || "").trim()));

  // 2. User Self-Marked Marking for Today (on unmarked subjects)
  const userMarkedHeld = subjects.reduce((acc, s) => acc + (s.todayHeld || 0), 0);
  const userMarkedPresent = subjects.reduce((acc, s) => acc + (s.todayPresent || 0), 0);

  // 3. Combined Totals for Today (Max 8 per working day)
  const totalHeldToday = erpMarkedHeld + userMarkedHeld;
  const totalPresentToday = erpMarkedPresent + userMarkedPresent;
  const remainingSlotsForUser = Math.max(0, 8 - erpMarkedHeld - userMarkedHeld);
  const totalAvailableForUser = Math.max(0, 8 - erpMarkedHeld);

  const updateSubjectPeriods = (
    code: string,
    deltaHeld: number,
    deltaPresent: number
  ) => {
    const updated = subjects.map((s) => {
      if (s.code !== code) return s;

      const currentHeld = s.todayHeld || 0;
      const currentPres = s.todayPresent || 0;

      const maxPossibleHeld = currentHeld + remainingSlotsForUser;
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

  const handleResetUserToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = subjects.map((s) => ({
      ...s,
      todayHeld: 0,
      todayPresent: 0,
    }));
    onUpdateSubjects(updated);
  };

  // Filter remaining subjects: exclude already marked ERP subjects by default
  const availableSubjects = subjects.filter((s) => {
    if (!showAllSubjects && erpMarkedCodes.has((s.code || "").trim())) {
      return false;
    }
    const isLab = isLabCourse(s);
    if (filter === "labs") return isLab;
    if (filter === "lectures") return !isLab;
    return true;
  });

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d14]/70 backdrop-blur-xl overflow-hidden transition-all duration-200">
      {/* Clickable Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer select-none hover:bg-white/[0.02] transition"
      >
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Today's Period Tracker
              </h3>
              <span className="text-[11px] font-mono text-zinc-400">
                Thu, 19 Nov
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {erpMarkedHeld > 0 ? (
                <span>
                  <strong className="text-zinc-200">{erpMarkedHeld}/8 marked on ERP</strong>
                  {totalAvailableForUser > 0 ? (
                    <span> · {totalAvailableForUser} periods remaining to mark</span>
                  ) : (
                    <span> · All 8 periods complete</span>
                  )}
                </span>
              ) : (
                <span>Mark periods attended today (max 8 per day)</span>
              )}
            </p>
          </div>
        </div>

        {/* Status Indicators & Collapse Chevron */}
        <div className="flex items-center space-x-3 self-end sm:self-auto">
          {/* Visual 8-slot meter */}
          <div className="flex items-center space-x-1" title={`${totalHeldToday} of 8 periods marked`}>
            {Array.from({ length: 8 }).map((_, i) => {
              let dotBg = "bg-zinc-800";
              if (i < erpMarkedHeld) {
                dotBg = i < erpMarkedPresent ? "bg-emerald-400" : "bg-rose-400";
              } else if (i < totalHeldToday) {
                const userIdx = i - erpMarkedHeld;
                dotBg = userIdx < userMarkedPresent ? "bg-blue-400" : "bg-amber-400";
              }
              return (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${dotBg}`}
                />
              );
            })}
          </div>

          <span className="text-xs font-mono font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded-lg">
            {totalHeldToday}/8
          </span>

          <button
            type="button"
            className="p-1 rounded-lg text-zinc-400 hover:text-white transition"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Interactive Marking Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-white/[0.06] p-4 sm:p-5 space-y-5"
          >
            {/* SUBSECTION 1: ERP Officially Marked Periods for Today */}
            {erpTodayLogs.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-zinc-300 font-medium">
                    <Lock className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Officially Marked on College ERP ({erpMarkedHeld}/8 periods)</span>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {erpMarkedPresent} Present · {erpMarkedHeld - erpMarkedPresent} Absent
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {erpTodayLogs.map((log, idx) => (
                    <div
                      key={`${log.code}-${idx}`}
                      className="p-2.5 rounded-xl border border-white/[0.06] bg-zinc-900/60 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                          P{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-medium text-white truncate">
                            {log.name}
                          </h4>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {log.code} · {log.held} lec{log.held > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider shrink-0 ${
                          log.status === "P"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {log.status === "P" ? "Present" : "Absent"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBSECTION 2: Mark Remaining Periods */}
            <div className="space-y-3 pt-1 border-t border-white/[0.06]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-semibold text-white">
                      {erpTodayLogs.length > 0
                        ? `Mark Remaining Classes (${remainingSlotsForUser} of ${totalAvailableForUser} slots remaining)`
                        : `Mark Classes Today (${remainingSlotsForUser} of 8 slots remaining)`}
                    </h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {erpTodayLogs.length > 0
                      ? "Excluded already marked subjects above. Pick your remaining classes."
                      : "Add held and attended periods for your subjects today."}
                  </p>
                </div>

                {/* Filter and Reset Row */}
                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <div className="flex items-center p-0.5 bg-zinc-900 rounded-lg border border-white/[0.08] text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFilter("all")}
                      className={`px-2 py-0.5 rounded-md transition ${
                        filter === "all" ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("labs")}
                      className={`px-2 py-0.5 rounded-md transition ${
                        filter === "labs" ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Labs
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter("lectures")}
                      className={`px-2 py-0.5 rounded-md transition ${
                        filter === "lectures" ? "bg-zinc-800 text-white font-medium" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Lectures
                    </button>
                  </div>

                  {userMarkedHeld > 0 && (
                    <button
                      type="button"
                      onClick={handleResetUserToday}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center space-x-1 px-2 py-1 rounded-lg bg-zinc-900 border border-white/[0.08]"
                      title="Reset your self-marked periods"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Subject Cards for Remaining Classes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableSubjects.map((s) => {
                  const isLab = isLabCourse(s);
                  const held = s.todayHeld || 0;
                  const pres = s.todayPresent || 0;
                  const abs = Math.max(0, held - pres);

                  return (
                    <div
                      key={s.code}
                      className={`p-3 rounded-xl border transition ${
                        held > 0
                          ? "bg-zinc-900/90 border-blue-500/30"
                          : "bg-zinc-900/40 border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <h5 className="text-xs font-semibold text-white truncate">
                              {s.name}
                            </h5>
                            {isLab && (
                              <span className="text-[9px] font-mono font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1 py-0.2 rounded shrink-0">
                                Lab
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {s.code} · Current: {s.pct}%
                          </span>
                        </div>

                        {held > 0 && (
                          <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-lg shrink-0">
                            {pres}/{held} marked
                          </span>
                        )}
                      </div>

                      {/* Controls: Present and Absent buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {held === 0 ? "Not held" : `${pres} Attended · ${abs} Bunked`}
                        </span>

                        <div className="flex items-center space-x-1.5">
                          {/* Present Button (+) */}
                          <button
                            type="button"
                            disabled={remainingSlotsForUser <= 0}
                            onClick={() => updateSubjectPeriods(s.code, 1, 1)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold transition disabled:opacity-40 active:scale-95 flex items-center space-x-1"
                            title="Mark 1 Present"
                          >
                            <Plus className="h-3 w-3" />
                            <span>P</span>
                          </button>

                          {/* Absent Button (A) */}
                          <button
                            type="button"
                            disabled={remainingSlotsForUser <= 0}
                            onClick={() => updateSubjectPeriods(s.code, 1, 0)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold transition disabled:opacity-40 active:scale-95 flex items-center space-x-1"
                            title="Mark 1 Absent"
                          >
                            <Plus className="h-3 w-3" />
                            <span>A</span>
                          </button>

                          {/* Undo Button (-) */}
                          {held > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const deltaPres = pres > 0 ? -1 : 0;
                                updateSubjectPeriods(s.code, -1, deltaPres);
                              }}
                              className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.08] transition active:scale-95"
                              title="Undo last period"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Toggle to show all subjects even if already on ERP */}
              {erpTodayLogs.length > 0 && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllSubjects(!showAllSubjects)}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 transition"
                  >
                    {showAllSubjects
                      ? "← Show only unmarked subjects"
                      : "Need to mark extra periods for an already-marked subject? Click here"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
