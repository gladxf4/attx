"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Search,
  Beaker,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  GraduationCap
} from "lucide-react";
import { SubjectRecord } from "@/lib/types";

interface SubjectAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPercentage?: number;
  initialSubjects?: SubjectRecord[];
  onSaveSubjects?: (subjects: SubjectRecord[]) => void;
}

export const SubjectAuditModal: React.FC<SubjectAuditModalProps> = ({
  isOpen,
  onClose,
  targetPercentage = 75,
  initialSubjects,
  onSaveSubjects,
}) => {
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "labs" | "lectures" | "critical">("all");

  useEffect(() => {
    if (isOpen) {
      if (initialSubjects && initialSubjects.length > 0) {
        setSubjects(initialSubjects);
      } else {
        try {
          const stored = localStorage.getItem("attendx_subjects");
          if (stored) {
            setSubjects(JSON.parse(stored));
          } else {
            setSubjects([]);
          }
        } catch {
          setSubjects([]);
        }
      }
    }
  }, [isOpen, initialSubjects]);

  if (!isOpen) return null;

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

  const toggleLabType = (code: string) => {
    const updated = subjects.map((s) => {
      if (s.code !== code) return s;
      return {
        ...s,
        isLab: !isLabCourse(s),
      };
    });
    setSubjects(updated);
    if (onSaveSubjects) {
      onSaveSubjects(updated);
    }
    try {
      localStorage.setItem("attendx_subjects", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const labsCount = subjects.filter(isLabCourse).length;
  const lecturesCount = subjects.length - labsCount;
  const criticalCount = subjects.filter((s) => s.pct < targetPercentage).length;

  const filteredSubjects = subjects.filter((s) => {
    // Search match
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filter === "labs") return isLabCourse(s);
    if (filter === "lectures") return !isLabCourse(s);
    if (filter === "critical") return s.pct < targetPercentage;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col clean-card border border-zinc-800 bg-zinc-950 shadow-2xl relative overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                <span>Subject Audit & Attendance Breakdown</span>
                <span className="text-xs font-mono font-normal text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                  {subjects.length} courses
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Individual subject tallies from ERP with safe bunks and recovery targets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:p-4 border-b border-zinc-800/80 bg-zinc-900/40 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search subject by code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 text-xs self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 rounded-md transition ${
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
                className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition ${
                  filter === "labs"
                    ? "bg-purple-900/50 text-purple-300 border border-purple-700/50 font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Beaker className="h-3 w-3 text-purple-400" />
                <span>Labs ({labsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter("lectures")}
                className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition ${
                  filter === "lectures"
                    ? "bg-blue-900/50 text-blue-300 border border-blue-700/50 font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <BookOpen className="h-3 w-3 text-blue-400" />
                <span>Lectures ({lecturesCount})</span>
              </button>
              {criticalCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter("critical")}
                  className={`px-2.5 py-1 rounded-md flex items-center space-x-1 transition ${
                    filter === "critical"
                      ? "bg-rose-900/50 text-rose-300 border border-rose-700/50 font-medium"
                      : "text-rose-400 hover:text-rose-200"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3 text-rose-400" />
                  <span>Below {targetPercentage}% ({criticalCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Course Cards / Table List */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1 max-h-[60vh]">
          {subjects.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-zinc-800 bg-zinc-900/30">
              <BookOpen className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-white mb-1">No Subject Records Synced Yet</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Connect your college ERP in the dashboard to load verified subject tallies and attendance counts.
              </p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-zinc-800 bg-zinc-900/30">
              <p className="text-xs text-zinc-400">No courses match the search query.</p>
            </div>
          ) : (
            filteredSubjects.map((s) => {
              const isLab = isLabCourse(s);
              const isSafe = s.pct >= targetPercentage;

              // Subject-level safe bunks or needed classes calculation
              const targetFrac = targetPercentage / 100;
              let subjectSafeBunks = 0;
              let subjectNeeded = 0;
              if (s.pct >= targetPercentage) {
                subjectSafeBunks = Math.max(0, Math.floor((s.pres - targetFrac * s.held) / targetFrac));
              } else {
                subjectNeeded = Math.max(0, Math.ceil((targetFrac * s.held - s.pres) / (1 - targetFrac)));
              }

              return (
                <div
                  key={s.code}
                  className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700/80 transition space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-start space-x-2.5">
                      <button
                        type="button"
                        onClick={() => toggleLabType(s.code)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border transition shrink-0 mt-0.5 ${
                          isLab
                            ? "bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25"
                            : "bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/25"
                        }`}
                        title="Click to toggle Lab vs Lecture classification"
                      >
                        {isLab ? "Lab (2 Lec)" : "Lecture"}
                      </button>
                      <div>
                        <h4 className="text-xs font-semibold text-white leading-snug">
                          {s.name}
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {s.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isSafe ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {s.pct.toFixed(1)}%
                        </span>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {s.pres} / {s.held} attended
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="min-w-[85px] text-right">
                        {isSafe ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>+{subjectSafeBunks} bunks</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Need {subjectNeeded || s.needed75}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSafe ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, s.pct))}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400">
          <span className="text-[11px] text-zinc-500">
            Tap any course badge to toggle between Lab and Lecture classification
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};