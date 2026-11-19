"use client";

import React from "react";
import { X, Check } from "lucide-react";

interface SubjectAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUBJECTS_DATA = [
  { code: "25AS301", name: "Applied Maths for Computing Applications", held: 55, pres: 35, abs: 20, pct: 63.64, needed75: 25 },
  { code: "25CS302", name: "Operating System", held: 44, pres: 28, abs: 16, pct: 63.64, needed75: 20 },
  { code: "25VA352", name: "Holistic skill & Innovation III", held: 12, pres: 6, abs: 6, pct: 50.00, needed75: 12 },
  { code: "25VA302", name: "Fundamentals of Cloud Computing", held: 31, pres: 21, abs: 10, pct: 67.74, needed75: 9 },
  { code: "25CS303", name: "Advanced Data Structures using C++", held: 57, pres: 42, abs: 15, pct: 73.68, needed75: 3 },
  { code: "25CS352", name: "Operating System Lab", held: 22, pres: 16, abs: 6, pct: 72.73, needed75: 2 },
  { code: "25VA351", name: "Web Designing Workshop-III", held: 30, pres: 22, abs: 8, pct: 73.33, needed75: 2 },
  { code: "25HU301", name: "Universal Human Values", held: 27, pres: 20, abs: 7, pct: 74.07, needed75: 1 },
  { code: "25VA309", name: "Employability Skills", held: 33, pres: 25, abs: 8, pct: 75.76, needed75: 0 },
  { code: "25CS301", name: "OOPS with C++", held: 36, pres: 31, abs: 5, pct: 86.11, needed75: 0, bunks: 5 },
  { code: "25CS351", name: "OOPS with C++ Lab", held: 20, pres: 18, abs: 2, pct: 90.00, needed75: 0, bunks: 4 },
  { code: "25CS353", name: "Advanced Data Structures Lab", held: 16, pres: 14, abs: 2, pct: 87.50, needed75: 0, bunks: 2 },
  { code: "25VA301", name: "Data Visualization using Python", held: 1, pres: 1, abs: 0, pct: 100.00, needed75: 0, bunks: 0 },
  { code: "HCL Tech.", name: "HCL Tech. (Block Course)", held: 40, pres: 40, abs: 0, pct: 100.00, needed75: 0, bunks: 13 }
];

export const SubjectAuditModal: React.FC<SubjectAuditModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col clean-card shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Subject-Wise Breakdown</h3>
            <p className="text-xs text-zinc-400">Class tallies & recovery targets for 75%</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3">
          <div className="overflow-x-auto rounded border border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 text-[11px]">
                <tr>
                  <th className="p-2.5">Code</th>
                  <th className="p-2.5">Subject</th>
                  <th className="p-2.5 text-center">Held</th>
                  <th className="p-2.5 text-center">Att</th>
                  <th className="p-2.5 text-center">Abs</th>
                  <th className="p-2.5 text-center">%</th>
                  <th className="p-2.5 text-right">To 75%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-zinc-300">
                {SUBJECTS_DATA.map((s, i) => (
                  <tr key={i} className="hover:bg-zinc-900/40">
                    <td className="p-2.5 font-mono text-zinc-400">{s.code}</td>
                    <td className="p-2.5 text-white font-medium">{s.name}</td>
                    <td className="p-2.5 text-center font-mono">{s.held}</td>
                    <td className="p-2.5 text-center font-mono text-zinc-200">{s.pres}</td>
                    <td className="p-2.5 text-center font-mono text-zinc-500">{s.abs}</td>
                    <td className="p-2.5 text-center font-mono">
                      <span className={s.pct >= 75 ? "text-emerald-400" : "text-rose-400"}>
                        {s.pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      {s.needed75 === 0 ? (
                        <span className="text-emerald-400 text-[11px]">
                          {s.bunks !== undefined ? `+${s.bunks} bunks` : "Safe"}
                        </span>
                      ) : (
                        <span className="text-amber-400 font-medium">
                          Need {s.needed75}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
