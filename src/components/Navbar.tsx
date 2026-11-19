"use client";

import React from "react";
import { Sliders, LogOut, BookOpen, RefreshCw } from "lucide-react";
import { UserProfile } from "@/lib/types";

interface NavbarProps {
  user: UserProfile | null;
  onOpenSettings: () => void;
  onOpenSubjects: () => void;
  onOpenSync: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenSettings,
  onOpenSubjects,
  onOpenSync,
  onReset,
}) => {
  return (
    <header className="w-full border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center">
            <img src="/logo.png" alt="AttendX" className="h-full w-full object-contain" />
          </div>
          <span className="font-semibold text-sm text-white tracking-tight">AttendX</span>
          <span className="text-[11px] text-zinc-500">ABES</span>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSync}
            className="flex items-center space-x-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition"
            title="Sync live numbers from ERP"
          >
            <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">ERP Sync</span>
          </button>

          <button
            onClick={onOpenSubjects}
            className="flex items-center space-x-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition"
          >
            <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Subjects</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition"
          >
            <Sliders className="h-3.5 w-3.5 text-zinc-400" />
            <span>Edit</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-rose-400 hover:border-rose-900 transition"
            title="Reset or Exit"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{user ? "Sign Out" : "Exit"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
