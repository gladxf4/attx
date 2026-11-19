"use client";

import React from "react";
import { Sliders, LogOut, BookOpen, Zap, MessageSquarePlus } from "lucide-react";
import { UserProfile } from "@/lib/types";

interface NavbarProps {
  user: UserProfile | null;
  onOpenSettings: () => void;
  onOpenSubjects: () => void;
  onOpenSync: () => void;
  onOpenFeedback: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenSettings,
  onOpenSubjects,
  onOpenSync,
  onOpenFeedback,
  onReset,
}) => {
  return (
    <header className="w-full border-b border-zinc-800/80 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center shadow-inner">
            <img src="/logo.png" alt="AttendX" className="h-full w-full object-contain" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="font-semibold text-sm text-white tracking-tight">AttendX</span>
            {user?.name && (
              <span className="text-[11px] text-zinc-500 font-normal hidden md:inline">
                • {user.name}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* ERP Sync */}
          <button
            onClick={onOpenSync}
            className="flex items-center space-x-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 text-xs text-amber-300 transition shadow-sm"
            title="Connect & sync directly from college ERP"
          >
            <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium">ERP Sync</span>
          </button>

          {/* Subjects */}
          <button
            onClick={onOpenSubjects}
            className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition"
            title="Subject-wise breakdown"
          >
            <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Subjects</span>
          </button>

          {/* Baseline Adjustment */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition"
            title="Adjust baseline and today's classes"
          >
            <Sliders className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Adjust</span>
          </button>

          {/* Report Bug / Feedback */}
          <button
            onClick={onOpenFeedback}
            className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition"
            title="Report a bug or give feedback"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Feedback</span>
          </button>

          {/* Sign Out / Exit */}
          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2 py-1.5 text-xs text-zinc-400 hover:text-rose-400 hover:border-rose-900 transition"
            title={user ? "Sign Out" : "Exit to Onboarding"}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{user ? "Sign Out" : "Exit"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
