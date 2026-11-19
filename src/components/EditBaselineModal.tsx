"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { UserProfile, AttendanceMetrics } from "@/lib/types";

interface EditBaselineModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  metrics: AttendanceMetrics;
  onSave: (data: {
    totalHeld: number;
    academicPresent: number;
    thursdayHeld: number;
    thursdayPresent: number;
    targetPercentage: number;
  }) => Promise<void>;
}

export const EditBaselineModal: React.FC<EditBaselineModalProps> = ({
  isOpen,
  onClose,
  metrics,
  onSave,
}) => {
  const [totalHeld, setTotalHeld] = useState(metrics.wednesdayHeld);
  const [academicPresent, setAcademicPresent] = useState(metrics.wednesdayPresent);
  const [thursdayHeld, setThursdayHeld] = useState(metrics.thursdayHeld);
  const [thursdayPresent, setThursdayPresent] = useState(metrics.thursdayPresent);
  const [targetPercentage, setTargetPercentage] = useState(metrics.targetPercentage);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        totalHeld: Number(totalHeld),
        academicPresent: Number(academicPresent),
        thursdayHeld: Number(thursdayHeld),
        thursdayPresent: Number(thursdayPresent),
        targetPercentage: Number(targetPercentage),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md clean-card p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-sm font-bold text-white mb-1">Edit Attendance Numbers</h3>
        <p className="text-xs text-zinc-400 mb-5">
          Adjust your lecture counts if you belong to another branch, semester, or section.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                Total Held (as of Wed)
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalHeld}
                onChange={(e) => setTotalHeld(Number(e.target.value))}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-300 mb-1">
                Present (as of Wed)
              </label>
              <input
                type="number"
                min="0"
                max={totalHeld}
                required
                value={academicPresent}
                onChange={(e) => setAcademicPresent(Number(e.target.value))}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-zinc-900 rounded-md border border-zinc-800 space-y-2">
            <span className="text-xs text-zinc-300 font-medium block">Thursday Classes (Today)</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Held Today</label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={thursdayHeld}
                  onChange={(e) => setThursdayHeld(Number(e.target.value))}
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Attended Today</label>
                <input
                  type="number"
                  min="0"
                  max={thursdayHeld}
                  value={thursdayPresent}
                  onChange={(e) => setThursdayPresent(Number(e.target.value))}
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-300 mb-1">
              Target Eligibility (%)
            </label>
            <input
              type="number"
              min="50"
              max="100"
              value={targetPercentage}
              onChange={(e) => setTargetPercentage(Number(e.target.value))}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-white text-zinc-950 font-semibold px-4 py-1.5 text-xs hover:bg-zinc-200 transition"
            >
              {isSaving ? "Saving..." : "Save Numbers"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
