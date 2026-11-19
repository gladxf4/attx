"use client";

import React from "react";
import { LogOut, BookOpen, Zap, MessageSquarePlus, Calendar, CheckCircle2, ChevronDown } from "lucide-react";
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
}) => {
  return (
    <header className="sticky top-2 z-40 px-3 sm:px-6 transition-all duration-200">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-3.5 sm:px-5 rounded-2xl border border-white/[0.08] bg-zinc-950/75 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.55)]">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-xl bg-zinc-900/90 border border-white/[0.08] p-1.5 flex items-center justify-center shadow-inner">
            <img src="/logo.png" alt="AttendX" className="h-full w-full object-contain" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm tracking-tight text-zinc-100 font-sans">
              AttendX
            </span>
            {hasERPInitialized ? (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Linked</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          {/* ERP Sync Button */}
          <button
            type="button"
            onClick={onOpenSync}
            className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800/90 px-3 py-1.5 text-xs text-zinc-200 hover:text-white transition shadow-sm active:scale-95"
            title="Sync latest records from college ERP"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400/30" />
            <span className="font-medium hidden xs:inline">ERP Sync</span>
          </button>

          {/* Subjects Audit */}
          <button
            type="button"
            onClick={onOpenSubjects}
            className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800/90 px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition shadow-sm active:scale-95"
            title="Subject-wise breakdown"
          >
            <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Courses</span>
            {subjectCount > 0 && (
              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded-full border border-white/[0.06]">
                {subjectCount}
              </span>
            )}
          </button>

          {/* Today Jump / Baseline */}
          {hasERPInitialized && onOpenPeriodTracker ? (
            <button
              type="button"
              onClick={onOpenPeriodTracker}
              className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800/90 px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition shadow-sm active:scale-95"
              title="Track today's periods"
            >
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Today</span>
            </button>
          ) : !hasERPInitialized ? (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800/90 px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition shadow-sm active:scale-95"
              title="Adjust baseline numbers"
            >
              <span className="hidden sm:inline">Baseline</span>
            </button>
          ) : null}

          {/* Feedback */}
          <button
            type="button"
            onClick={onOpenFeedback}
            className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800/90 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition active:scale-95"
            title="Report bug or feedback"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
          </button>

          {/* Sign Out / Exit */}
          <button
            type="button"
            onClick={onReset}
            className="flex items-center space-x-1.5 rounded-xl border border-white/[0.08] bg-zinc-900/80 hover:bg-rose-950/30 hover:border-rose-900/50 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-rose-300 transition active:scale-95"
            title={user ? "Sign Out" : "Exit"}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
