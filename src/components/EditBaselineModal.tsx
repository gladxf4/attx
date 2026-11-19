"use client";

import React, { useState } from "react";
import { X, Minus, Plus, Sliders } from "lucide-react";
import { motion } from "framer-motion";
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
    concessionBuffer?: number;
    officialPercentage?: number;
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
  const [officialPercentage, setOfficialPercentage] = useState<number | string>(
    metrics.concessionBuffer > 0 ? metrics.wednesdayPercentage : ""
  );
  const [thursdayHeld, setThursdayHeld] = useState(metrics.thursdayHeld);
  const [thursdayPresent, setThursdayPresent] = useState(metrics.thursdayPresent);
  const [targetPercentage, setTargetPercentage] = useState(metrics.targetPercentage);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const updateHeldToday = (val: number) => {
    const clamped = Math.max(0, Math.min(8, val));
    setThursdayHeld(clamped);
    if (thursdayPresent > clamped) {
      setThursdayPresent(clamped);
    }
  };

  const updateAttendedToday = (val: number) => {
    const clamped = Math.max(0, Math.min(thursdayHeld, val));
    setThursdayPresent(clamped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const held = Math.max(1, Number(totalHeld));
      const pres = Math.max(0, Math.min(held, Number(academicPresent)));
      let buffer = metrics.concessionBuffer;

      if (officialPercentage !== "" && Number(officialPercentage) > 0) {
        const targetOfficial = Math.round((Number(officialPercentage) / 100.0) * held);
        buffer = Math.max(0, targetOfficial - pres);
      }

      await onSave({
        totalHeld: held,
        academicPresent: pres,
        thursdayHeld,
        thursdayPresent,
        targetPercentage: Math.max(50, Math.min(100, Number(targetPercentage))),
        concessionBuffer: buffer,
        officialPercentage: officialPercentage !== "" ? Number(officialPercentage) : undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md apple-card bg-[#0e0f17] p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-2.5 mb-1">
          <div className="h-8 w-8 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-300">
            <Sliders className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-white">Attendance Baseline</h3>
        </div>
        <p className="text-xs text-zinc-400 mb-5">
          Configure baseline lecture tallies manually if needed.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Total Held
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalHeld}
                onChange={(e) => setTotalHeld(Number(e.target.value))}
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm font-mono text-white focus:border-white/[0.2] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Present
              </label>
              <input
                type="number"
                min="0"
                max={totalHeld}
                required
                value={academicPresent}
                onChange={(e) => setAcademicPresent(Number(e.target.value))}
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm font-mono text-white focus:border-white/[0.2] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-zinc-300">
                Official Attendance (%)
              </label>
              <span className="text-[10px] text-zinc-500">Optional</span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="e.g. 78.64"
              value={officialPercentage}
              onChange={(e) => setOfficialPercentage(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm font-mono text-white focus:border-white/[0.2] focus:outline-none"
            />
          </div>

          {/* Steppers for Thursday Classes */}
          <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Today's Classes</span>
              <span className="text-[10px] text-zinc-500 font-mono">Max 8/day</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Held Today</label>
                <div className="flex items-center justify-between bg-[#090a0f] border border-white/[0.08] rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => updateHeldToday(thursdayHeld - 1)}
                    disabled={thursdayHeld <= 0}
                    className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 flex items-center justify-center transition"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-mono text-xs font-bold text-white px-2">
                    {thursdayHeld}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateHeldToday(thursdayHeld + 1)}
                    disabled={thursdayHeld >= 8}
                    className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 flex items-center justify-center transition"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Attended Today</label>
                <div className="flex items-center justify-between bg-[#090a0f] border border-white/[0.08] rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => updateAttendedToday(thursdayPresent - 1)}
                    disabled={thursdayPresent <= 0}
                    className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 flex items-center justify-center transition"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-mono text-xs font-bold text-white px-2">
                    {thursdayPresent}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateAttendedToday(thursdayPresent + 1)}
                    disabled={thursdayPresent >= thursdayHeld}
                    className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 flex items-center justify-center transition"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Target Eligibility (%)
            </label>
            <input
              type="number"
              min="50"
              max="100"
              value={targetPercentage}
              onChange={(e) => setTargetPercentage(Number(e.target.value))}
              className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm font-mono text-white focus:border-white/[0.2] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-white text-zinc-950 font-semibold px-4 py-1.5 text-xs hover:bg-zinc-200 transition"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
