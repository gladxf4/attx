"use client";

import React from "react";
import {
  RotateCw,
  LayoutGrid,
  Calendar,
  MessageSquarePlus,
  LogOut,
  Sliders,
} from "lucide-react";
import { motion } from "framer-motion";
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
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-3 z-40 px-3 sm:px-6 transition-all duration-200"
    >
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-3.5 sm:px-5 rounded-2xl border border-white/[0.08] bg-[#0c0d14]/80 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.65)]">
        {/* Brand with increased icon size & clean live indicator */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-zinc-900/90 border border-white/[0.1] p-1.5 flex items-center justify-center shadow-inner relative group">
            <img src="/logo.png" alt="AttendX" className="h-full w-full object-contain" />
            {hasERPInitialized && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-[#0c0d14]" />
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-sm tracking-tight text-white font-sans">
                AttendX
              </span>
              {hasERPInitialized && (
                <span className="text-[10px] text-zinc-500 font-mono tracking-tight hidden sm:inline">
                  ERP
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* ERP Sync Button (semantic refresh icon, active spinner) */}
          <button
            type="button"
            onClick={onOpenSync}
            className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/70 hover:bg-zinc-800/90 hover:border-white/[0.16] px-3 py-1.5 text-xs text-zinc-200 hover:text-white transition apple-interactive"
            title="Sync latest records from college ERP"
          >
            <RotateCw
              className={`h-3.5 w-3.5 text-zinc-300 ${isSyncing ? "animate-spin text-emerald-400" : ""}`}
            />
            <span className="font-medium hidden xs:inline">
              {isSyncing ? "Syncing..." : "Sync ERP"}
            </span>
          </button>

          {/* Courses Breakdown */}
          <button
            type="button"
            onClick={onOpenSubjects}
            className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/70 hover:bg-zinc-800/90 hover:border-white/[0.16] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition apple-interactive"
            title="Subject-wise breakdown"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline font-medium">Subjects</span>
            {subjectCount > 0 && (
              <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.06] px-1.5 py-0.2 rounded-full">
                {subjectCount}
              </span>
            )}
          </button>

          {/* Today's Tracker Quick Jump */}
          {hasERPInitialized && onOpenPeriodTracker ? (
            <button
              type="button"
              onClick={onOpenPeriodTracker}
              className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/70 hover:bg-zinc-800/90 hover:border-white/[0.16] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition apple-interactive"
              title="Track today's periods"
            >
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span className="hidden sm:inline font-medium">Today</span>
            </button>
          ) : !hasERPInitialized ? (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/70 hover:bg-zinc-800/90 hover:border-white/[0.16] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition apple-interactive"
              title="Adjust baseline numbers"
            >
              <Sliders className="h-3.5 w-3.5 text-zinc-400" />
              <span className="hidden sm:inline font-medium">Settings</span>
            </button>
          ) : null}

          {/* Feedback */}
          <button
            type="button"
            onClick={onOpenFeedback}
            className="flex items-center rounded-xl border border-white/[0.08] bg-zinc-900/70 hover:bg-zinc-800/90 hover:border-white/[0.16] p-2 text-zinc-400 hover:text-zinc-200 transition apple-interactive"
            title="Report bug or feedback"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
          </button>

          {/* Sign Out / Exit */}
          <button
            type="button"
            onClick={onReset}
            className="flex items-center rounded-xl border border-white/[0.08] bg-zinc-900/70 hover:bg-rose-950/40 hover:border-rose-900/40 p-2 text-zinc-400 hover:text-rose-300 transition apple-interactive"
            title={user ? "Sign Out" : "Exit"}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.header>
  );
};
