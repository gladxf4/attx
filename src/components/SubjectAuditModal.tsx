"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  LayoutGrid,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { SubjectRecord } from "@/lib/types";
import { isLabSubject } from "@/lib/attendanceEngine";

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
    return isLabSubject(s.code, s.name);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-3xl max-h-[90vh] flex flex-col apple-card bg-[#0e0f17] shadow-2xl relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.06] bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center space-x-2">
                <span>Subjects & Attendance</span>
                <span className="text-xs font-mono font-normal text-zinc-400 bg-white/[0.06] px-2 py-0.5 rounded-full">
                  {subjects.length} subjects
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Subject breakdown synced from ERP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.06] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:p-4 border-b border-white/[0.06] bg-zinc-900/30 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search subject by code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/[0.2] transition"
              />
            </div>

            <div className="flex items-center space-x-1 text-xs self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
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
                Labs ({labsCount})
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
                Lectures ({lecturesCount})
              </button>
              {criticalCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter("critical")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filter === "critical"
                      ? "bg-rose-950/40 text-rose-300 font-medium border border-rose-800/40"
                      : "text-rose-400 hover:text-rose-200"
                  }`}
                >
                  Below {targetPercentage}% ({criticalCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Course Cards */}
        <div className="overflow-y-auto p-4 space-y-2 flex-1 max-h-[60vh]">
          {subjects.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-white/[0.06] bg-zinc-900/30">
              <h4 className="text-sm font-semibold text-white mb-1">No Subjects Synced</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Connect your college ERP to load verified subject tallies.
              </p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-white/[0.06] bg-zinc-900/30">
              <p className="text-xs text-zinc-400">No subjects match the query.</p>
            </div>
          ) : (
            filteredSubjects.map((s) => {
              const isLab = isLabCourse(s);
              const isSafe = s.pct >= targetPercentage;

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
                  className="p-3.5 rounded-xl border border-white/[0.06] bg-zinc-900/50 hover:border-white/[0.12] transition space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-start space-x-2.5">
                      <button
                        type="button"
                        onClick={() => toggleLabType(s.code)}
                        className="mt-1 flex items-center space-x-1 text-[11px] text-zinc-400 hover:text-white transition"
                        title="Click to toggle Lab vs Lecture"
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isLab ? "bg-purple-400" : "bg-blue-400"
                          }`}
                        />
                      </button>
                      <div>
                        <h4 className="text-xs font-semibold text-white leading-snug">
                          {s.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-500">
                          <span>{s.code}</span>
                          <span>•</span>
                          <span>{isLab ? "Lab" : "Lecture"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 self-end sm:self-auto shrink-0">
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

                      <div className="min-w-[85px] text-right font-mono text-xs">
                        {isSafe ? (
                          <span className="text-emerald-400 font-medium">
                            +{subjectSafeBunks} bunks
                          </span>
                        ) : (
                          <span className="text-rose-400 font-medium">
                            Need {subjectNeeded || s.needed75}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Slim Progress Bar */}
                  <div className="w-full bg-[#090a0f] rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSafe ? "bg-emerald-400" : "bg-rose-400"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, s.pct))}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/[0.06] bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-400">
          <span className="text-[11px] text-zinc-500">
            Click any dot to toggle Lab vs Lecture classification
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
