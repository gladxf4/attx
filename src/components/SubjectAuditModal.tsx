"use client";

import React, { useState, useEffect } from "react";
import { X, BookOpen, AlertCircle } from "lucide-react";

interface SubjectItem {
  code: string;
  name: string;
  held: number;
  pres: number;
  abs: number;
  pct: number;
  needed75: number;
  bunks?: number;
}

interface SubjectAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubjectAuditModal: React.FC<SubjectAuditModalProps> = ({ isOpen, onClose }) => {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col clean-card shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Subject Breakdown</h3>
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
          {subjects.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-zinc-800/80 bg-zinc-900/40">
              <BookOpen className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
              <h4 className="text-sm font-medium text-white mb-1">No Subject Records Synced Yet</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Overall aggregate attendance, safe bunks, and MT2 eligibility are tracked on your dashboard. Individual subject tallies will appear here once imported.
              </p>
            </div>
          ) : (
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
                  {subjects.map((s, i) => (
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
          )}
        </div>
      </div>
    </div>
  );
};
