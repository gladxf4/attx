"use client";

import React, { useState } from "react";
import {
  RotateCw,
  LayoutGrid,
  Calendar,
  MessageSquarePlus,
  LogOut,
  Sliders,
  Menu,
  X,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile } from "@/lib/types";

interface NavbarProps {
  user: UserProfile | null;
  onOpenSettings: () => void;
  onOpenSubjects: () => void;
  onOpenSync: () => void;
  onOpenFeedback: () => void;
  onOpenPeriodTracker?: () => void;
  onReset: () => void;
  subjectCount?: number;
  hasERPInitialized?: boolean;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenSettings,
  onOpenSubjects,
  onOpenSync,
  onOpenFeedback,
  onOpenPeriodTracker,
  onReset,
  subjectCount = 0,
  hasERPInitialized = false,
  isSyncing = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-2 sm:top-3 z-40 px-3 sm:px-6 w-full"
    >
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-3 sm:px-5 rounded-2xl border border-white/[0.08] bg-[#0c0d14]/85 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.65)] relative">
        {/* Brand: Bigger Logo, Modern Display Typography, No "ERP" tag, No green dot */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-zinc-900 border border-white/[0.1] p-1.5 flex items-center justify-center shadow-inner">
            <img src="/logo.png" alt="AttendX" className="h-full w-full object-contain" />
          </div>
          <span className="font-black text-base sm:text-lg tracking-tight text-white font-sans">
            AttendX
          </span>
        </div>

        {/* Desktop Controls (Hidden on Mobile) */}
        <div className="hidden md:flex items-center space-x-2">
          {/* ERP Sync Button */}
          <button
            type="button"
            onClick={onOpenSync}
            className={`flex items-center space-x-1.5 rounded-xl border px-3 py-1.5 text-xs transition active:scale-95 ${
              isSyncing
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : hasERPInitialized
                ? "bg-zinc-900/80 border-white/[0.08] hover:bg-zinc-800 hover:border-white/[0.16] text-zinc-200"
                : "bg-blue-600 hover:bg-blue-500 text-white border-transparent font-medium"
            }`}
            title="Sync latest records from college ERP"
          >
            <RotateCw
              className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-emerald-400" : "text-zinc-300"}`}
            />
            <span className="font-medium">
              {isSyncing ? "Syncing..." : hasERPInitialized ? "Sync ERP" : "Connect ERP"}
            </span>
          </button>

          {/* Subjects Breakdown */}
          <button
            type="button"
            onClick={onOpenSubjects}
            className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800 hover:border-white/[0.16] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition active:scale-95"
            title="Subject-wise attendance breakdown"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-zinc-400" />
            <span className="font-medium">Subjects</span>
            {subjectCount > 0 && (
              <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.06] px-1.5 py-0.5 rounded-full">
                {subjectCount}
              </span>
            )}
          </button>

          {/* Today's Tracker Quick Jump */}
          {hasERPInitialized && onOpenPeriodTracker ? (
            <button
              type="button"
              onClick={onOpenPeriodTracker}
              className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800 hover:border-white/[0.16] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition active:scale-95"
              title="Track today's periods"
            >
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-medium">Today</span>
            </button>
          ) : !hasERPInitialized ? (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800 hover:border-white/[0.16] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition active:scale-95"
              title="Adjust baseline numbers"
            >
              <Sliders className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-medium">Settings</span>
            </button>
          ) : null}

          {/* Feedback */}
          <button
            type="button"
            onClick={onOpenFeedback}
            className="flex items-center rounded-xl border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800 hover:border-white/[0.16] p-2 text-zinc-400 hover:text-zinc-200 transition active:scale-95"
            title="Rate & Feedback"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={onReset}
            className="flex items-center rounded-xl border border-white/[0.08] bg-zinc-900/80 hover:bg-rose-950/40 hover:border-rose-900/40 p-2 text-zinc-400 hover:text-rose-300 transition active:scale-95"
            title={user ? "Sign Out" : "Exit"}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mobile Action Bar (Zero-Overflow Layout for Mobile Phones) */}
        <div className="flex md:hidden items-center space-x-1.5">
          {/* Compact Sync Pill */}
          <button
            type="button"
            onClick={onOpenSync}
            className={`flex items-center space-x-1 rounded-xl border px-2.5 py-1.5 text-xs transition ${
              isSyncing
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-zinc-900/80 border-white/[0.08] text-zinc-300"
            }`}
          >
            <RotateCw className={`h-3 w-3 ${isSyncing ? "animate-spin text-emerald-400" : ""}`} />
            <span className="text-[11px] font-medium">{isSyncing ? "Syncing" : "Sync"}</span>
          </button>

          {/* Compact Subjects Badge Button */}
          <button
            type="button"
            onClick={onOpenSubjects}
            className="flex items-center space-x-1 rounded-xl border border-white/[0.08] bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-300"
          >
            <LayoutGrid className="h-3 w-3 text-zinc-400" />
            {subjectCount > 0 && (
              <span className="text-[10px] font-mono text-zinc-300">{subjectCount}</span>
            )}
          </button>

          {/* Mobile Drawer Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center rounded-xl border border-white/[0.08] bg-zinc-900/80 p-1.5 text-zinc-300 active:bg-zinc-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.18 }}
            className="md:hidden mx-auto max-w-4xl mt-2 p-3 rounded-2xl border border-white/[0.1] bg-[#0c0d14]/95 backdrop-blur-2xl shadow-2xl space-y-1"
          >
            {hasERPInitialized && onOpenPeriodTracker && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPeriodTracker();
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs text-zinc-200 hover:bg-white/[0.06] transition"
              >
                <Calendar className="h-4 w-4 text-zinc-400" />
                <span>Today's Periods & Marking</span>
              </button>
            )}

            {!hasERPInitialized && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs text-zinc-200 hover:bg-white/[0.06] transition"
              >
                <Sliders className="h-4 w-4 text-zinc-400" />
                <span>Adjust Baseline Numbers</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenFeedback();
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs text-zinc-200 hover:bg-white/[0.06] transition"
            >
              <MessageSquarePlus className="h-4 w-4 text-zinc-400" />
              <span>Rate & Feedback</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onReset();
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs text-rose-300 hover:bg-rose-500/10 transition border-t border-white/[0.06] mt-1 pt-2"
            >
              <LogOut className="h-4 w-4 text-rose-400" />
              <span>{user ? "Sign Out" : "Exit Guest"}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
