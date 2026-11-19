"use client";

import React from "react";
import { X, BookOpen, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";

interface SubjectAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VERIFIED_SUBJECTS = [
  { code: "25AS301", name: "Applied Maths for Computing Applications", held: 55, pres: 35, abs: 20, pct: 63.64, needed75: 25, status: "critical" },
  { code: "25CS302", name: "Operating System", held: 44, pres: 28, abs: 16, pct: 63.64, needed75: 20, status: "critical" },
  { code: "25VA352", name: "Holistic skill & Innovation III", held: 12, pres: 6, abs: 6, pct: 50.00, needed75: 12, status: "critical" },
  { code: "25VA302", name: "Fundamentals of Cloud Computing", held: 31, pres: 21, abs: 10, pct: 67.74, needed75: 9, status: "warning" },
  { code: "25CS303", name: "Advanced Data Structures using C++", held: 57, pres: 42, abs: 15, pct: 73.68, needed75: 3, status: "warning" },
  { code: "25CS352", name: "Operating System Lab", held: 22, pres: 16, abs: 6, pct: 72.73, needed75: 2, status: "warning" },
  { code: "25VA351", name: "Web Designing Workshop-III", held: 30, pres: 22, abs: 8, pct: 73.33, needed75: 2, status: "warning" },
  { code: "25HU301", name: "Universal Human Values", held: 27, pres: 20, abs: 7, pct: 74.07, needed75: 1, status: "warning" },
  { code: "25VA309", name: "Employability Skills", held: 33, pres: 25, abs: 8, pct: 75.76, needed75: 0, status: "safe" },
  { code: "25CS301", name: "OOPS with C++", held: 36, pres: 31, abs: 5, pct: 86.11, needed75: 0, bunks: 5, status: "safe" },
  { code: "25CS351", name: "OOPS with C++ Lab", held: 20, pres: 18, abs: 2, pct: 90.00, needed75: 0, bunks: 4, status: "safe" },
  { code: "25CS353", name: "Advanced Data Structures Lab", held: 16, pres: 14, abs: 2, pct: 87.50, needed75: 0, bunks: 2, status: "safe" },
  { code: "25VA301", name: "Data Visualization using Python", held: 1, pres: 1, abs: 0, pct: 100.00, needed75: 0, bunks: 0, status: "safe" },
  { code: "HCL Tech.", name: "HCL Tech. (Block Course)", held: 40, pres: 40, abs: 0, pct: 100.00, needed75: 0, bunks: 13, status: "safe" }
];

export const SubjectAuditModal: React.FC<SubjectAuditModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl glass-card border border-slate-700 shadow-2xl relative glow-primary overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Subject-Wise Attendance Audit</h3>
              <p className="text-xs text-slate-400">Detailed breakdown & individual 75% thresholds</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Table Area */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3 text-center">Held</th>
                  <th className="p-3 text-center">Present</th>
                  <th className="p-3 text-center">Absent</th>
                  <th className="p-3 text-center">Raw %</th>
                  <th className="p-3 text-right">Target to 75%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {VERIFIED_SUBJECTS.map((sub, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-semibold text-slate-200">{sub.code}</td>
                    <td className="p-3 font-medium text-slate-100">{sub.name}</td>
                    <td className="p-3 text-center font-mono">{sub.held}</td>
                    <td className="p-3 text-center font-mono text-emerald-400">{sub.pres}</td>
                    <td className="p-3 text-center font-mono text-rose-400">{sub.abs}</td>
                    <td className="p-3 text-center font-mono font-bold">
                      <span
                        className={`rounded px-1.5 py-0.5 ${
                          sub.pct >= 75
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-rose-500/10 text-rose-300"
                        }`}
                      >
                        {sub.pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {sub.status === "safe" ? (
                        <span className="text-emerald-400 flex items-center justify-end space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>{sub.bunks ? `+${sub.bunks} bunks` : "Safe"}</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold">
                          Need {sub.needed75} {sub.needed75 === 1 ? "class" : "classes"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3.5 text-xs text-slate-300">
            <span className="font-semibold text-indigo-300">Pro-Tip for MT2:</span> Priority focus should be on <strong>Universal Human Values (1 class away)</strong> and your <strong>Lab sessions (2 periods away)</strong> for immediate quick wins!
          </div>
        </div>
      </div>
    </div>
  );
};
