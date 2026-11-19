"use client";

import React, { useState } from "react";
import { X, Save, Sliders, Info, Check } from "lucide-react";
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
    branch?: string;
  }) => Promise<void>;
}

export const EditBaselineModal: React.FC<EditBaselineModalProps> = ({
  isOpen,
  onClose,
  user,
  metrics,
  onSave,
}) => {
  const [totalHeld, setTotalHeld] = useState(metrics.wednesdayHeld);
  const [academicPresent, setAcademicPresent] = useState(metrics.wednesdayPresent);
  const [thursdayHeld, setThursdayHeld] = useState(metrics.thursdayHeld);
  const [thursdayPresent, setThursdayPresent] = useState(metrics.thursdayPresent);
  const [targetPercentage, setTargetPercentage] = useState(metrics.targetPercentage);
  const [branch, setBranch] = useState(user?.branch || "AIML-3A");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
        branch,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl glass-card border border-slate-700 p-6 sm:p-7 shadow-2xl relative glow-primary">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Customize Baseline & Attendance</h3>
            <p className="text-xs text-slate-400">
              {user ? "Saved to your cloud profile on Neon DB" : "Saved locally on this device"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Branch / Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Branch / Section
            </label>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="e.g. AIML-3A, CSE-2B, ECE-3"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Wednesday Total Held & Attended */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Total Held (as of Wed 18 Nov)
              </label>
              <input
                type="number"
                min="1"
                value={totalHeld}
                onChange={(e) => setTotalHeld(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
              <span className="text-[10px] text-slate-500">Your total lectures held</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Attended (as of Wed 18 Nov)
              </label>
              <input
                type="number"
                min="0"
                max={totalHeld}
                value={academicPresent}
                onChange={(e) => setAcademicPresent(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
              <span className="text-[10px] text-slate-500">Academic present count</span>
            </div>
          </div>

          {/* Thursday (Today) Marked Lectures */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3.5 space-y-3">
            <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1">
              <span>Thursday (19 Nov) Lectures</span>
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Classes Held Today
                </label>
                <input
                  type="number"
                  min="0"
                  max="8"
                  value={thursdayHeld}
                  onChange={(e) => setThursdayHeld(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Classes Attended Today
                </label>
                <input
                  type="number"
                  min="0"
                  max={thursdayHeld}
                  value={thursdayPresent}
                  onChange={(e) => setThursdayPresent(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Target Percentage */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Eligibility Percentage (%)
            </label>
            <input
              type="number"
              min="50"
              max="100"
              value={targetPercentage}
              onChange={(e) => setTargetPercentage(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
            <span className="text-[10px] text-slate-500">Standard AKTU / ABES requirement is 75%</span>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:brightness-110 transition disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? "Saving..." : "Save Baseline"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
