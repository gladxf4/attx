"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Flame } from "lucide-react";
import { AttendanceMetrics } from "@/lib/types";

interface AttendanceHeroProps {
  metrics: AttendanceMetrics;
  onRefreshQuote?: () => void;
}

export const AttendanceHero: React.FC<AttendanceHeroProps> = ({ metrics }) => {
  const [copied, setCopied] = useState(false);

  const getTierBadge = () => {
    switch (metrics.statusTier) {
      case "god":
        return {
          icon: <Flame className="h-4 w-4 text-amber-400" />,
          label: "God Tier • Proctor Safe",
          bg: "bg-amber-500/10 text-amber-300 border-amber-500/30",
        };
      case "safe":
        return {
          icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
          label: "MT2 Eligible • Safe Zone",
          bg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
        };
      case "borderline":
        return {
          icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
          label: "Borderline • Attend Classes",
          bg: "bg-amber-500/10 text-amber-300 border-amber-500/30",
        };
      default:
        return {
          icon: <AlertTriangle className="h-4 w-4 text-rose-400" />,
          label: "Debarment Risk • Emergency",
          bg: "bg-rose-500/10 text-rose-300 border-rose-500/30",
        };
    }
  };

  const badge = getTierBadge();

  return (
    <div className="relative overflow-hidden rounded-2xl glass-card p-6 sm:p-8 glow-primary">
      {/* Background ambient lighting */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left Column: Official Percentage & Wednesday Comparison */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <span className={`inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${badge.bg}`}>
              {badge.icon}
              <span>{badge.label}</span>
            </span>
            <span className="text-xs text-slate-400">
              Target: <strong className="text-slate-200">{metrics.targetPercentage}%</strong>
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white">
              {metrics.currentPercentage}%
            </h1>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Official ERP %
              </span>
              <span className="text-[11px] text-slate-400">
                Updated as of Thursday, 19 Nov
              </span>
            </div>
          </div>

          {/* Wednesday Comparison Tag */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <div className="rounded-lg bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 text-slate-300">
              As of Wednesday (18 Nov):{" "}
              <strong className="text-slate-100 font-bold">{metrics.wednesdayPercentage}%</strong>
            </div>
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-emerald-300">
              Today: <strong>+{metrics.thursdayHeld} classes marked</strong> ({metrics.thursdayPresent} P)
            </div>
          </div>
        </div>

        {/* Right Column: Goofy Quote Card */}
        <div className="md:max-w-md w-full">
          <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-slate-900/60 p-4 relative group">
            <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold mb-2">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>AttendX Mood Radar</span>
              </div>
            </div>

            <p className="text-sm font-medium text-slate-200 leading-relaxed italic">
              "{metrics.goofyQuote}"
            </p>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
              <span>ABES Campus Realities</span>
              <span className="text-indigo-400 font-medium">Bunk responsibly</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
