"use client";

import React from "react";
import { User, LogIn, LogOut, Sliders, Sparkles, BookOpen } from "lucide-react";
import { UserProfile } from "@/lib/types";

interface NavbarProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onOpenSubjects: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onOpenSettings,
  onOpenSubjects,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <img src="/logo.png" alt="AttendX Logo" className="h-full w-full object-contain p-1" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">Attend<span className="text-indigo-400">X</span></span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                v2.0 Web
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">ABES Smart Attendance & Bunk Predictor</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Subject Breakdown Button */}
          <button
            onClick={onOpenSubjects}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            title="View Subject-wise Audit"
          >
            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Subject Audit</span>
          </button>

          {/* Settings / Edit Baseline */}
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            title="Edit Total Held / Present"
          >
            <Sliders className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Baseline</span>
          </button>

          {/* User Account / Auth */}
          {user ? (
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{user.name || user.username}</span>
                <span className="text-[10px] text-slate-400">{user.branch}</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:brightness-110"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In / Sync</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
