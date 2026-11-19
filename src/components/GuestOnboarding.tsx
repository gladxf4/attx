"use client";

import React, { useState } from "react";
import { ArrowRight, Minus, Plus, AlertCircle, HelpCircle, Pencil, Info } from "lucide-react";
import { motion } from "framer-motion";
import { UserProfile } from "@/lib/types";
import { getDynamicBaselineInfo } from "@/lib/attendanceEngine";

interface GuestOnboardingProps {
  onCompleteGuest: (data: {
    totalHeld: number;
    academicPresent: number;
    thursdayHeld: number;
    thursdayPresent: number;
    targetPercentage: number;
    concessionBuffer?: number;
    officialPercentage?: number;
  }) => void;
  onLoginSuccess: (token: string, user: UserProfile) => void;
  onOpenFeedback?: () => void;
}

export const GuestOnboarding: React.FC<GuestOnboardingProps> = ({
  onCompleteGuest,
  onLoginSuccess,
  onOpenFeedback,
}) => {
  const [mode, setMode] = useState<"guest" | "auth">("guest");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  const baselineInfo = getDynamicBaselineInfo();

  const [totalHeldInput, setTotalHeldInput] = useState<string>("");
  const [presentInput, setPresentInput] = useState<string>("");
  const [officialPctInput, setOfficialPctInput] = useState<string>("");

  const handleLoadAIMLBenchmark = () => {
    setTotalHeldInput(String(baselineInfo.anchorHeldAIML));
    setPresentInput(String(baselineInfo.anchorPresentAIML));
    setOfficialPctInput(String(baselineInfo.anchorOfficialPctAIML));
    setAuthError(null);
  };

  const [thursdayHeld, setThursdayHeld] = useState<number>(8);
  const [thursdayPresent, setThursdayPresent] = useState<number>(0);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const held = Number(totalHeldInput);
    const pres = Number(presentInput);
    const offPct = officialPctInput ? Number(officialPctInput) : undefined;

    if (!held || held <= 0) {
      setAuthError("Please enter your total lectures held.");
      return;
    }

    if (pres === undefined || pres < 0 || pres > held) {
      setAuthError("Please enter valid classes attended.");
      return;
    }

    let calculatedBuffer = 0;
    if (offPct !== undefined && offPct > 0) {
      const targetOfficial = Math.round((offPct / 100.0) * held);
      calculatedBuffer = Math.max(0, targetOfficial - pres);
    }

    onCompleteGuest({
      totalHeld: held,
      academicPresent: pres,
      thursdayHeld,
      thursdayPresent,
      targetPercentage: 75,
      concessionBuffer: calculatedBuffer,
      officialPercentage: offPct,
    });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authTab === "register" && !name.trim()) {
      setAuthError("Full Name is mandatory.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = authTab === "login" ? "/api/auth/login" : "/api/auth/register";
      const held = Number(totalHeldInput) || 0;
      const pres = Number(presentInput) || 0;
      const offPct = officialPctInput ? Number(officialPctInput) : undefined;

      const payload =
        authTab === "login"
          ? { username: username.trim(), password }
          : {
              username: username.trim(),
              password,
              name: name.trim(),
              totalHeld: held,
              academicPresent: pres,
              officialPercentage: offPct,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setAuthError(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen apple-canvas flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="flex flex-col items-center justify-center mb-7">
          <div className="relative flex items-center justify-center mb-3">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-blue-600/30 via-indigo-500/20 to-emerald-500/20 blur-xl opacity-80 animate-pulse pointer-events-none" />
            <div className="relative h-16 w-16 rounded-2xl bg-zinc-900/90 border border-white/[0.12] p-2.5 flex items-center justify-center shadow-2xl backdrop-blur-xl">
              <img src="/logo.png" alt="AttendX" className="h-full w-full object-contain filter drop-shadow" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight font-sans">
            AttendX
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Precision Attendance Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="apple-card p-6">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-zinc-900 rounded-xl border border-white/[0.08] mb-4 text-xs font-medium">
            <button
              onClick={() => { setMode("guest"); setAuthError(null); }}
              className={`py-1.5 rounded-lg transition ${
                mode === "guest"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Guest
            </button>
            <button
              onClick={() => { setMode("auth"); setAuthError(null); }}
              className={`py-1.5 rounded-lg transition ${
                mode === "auth"
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign In
            </button>
          </div>

          {authError && (
            <div className="flex items-center space-x-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl mb-3">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {mode === "guest" ? (
            <form onSubmit={handleGuestSubmit} className="space-y-3.5">
              <div className="p-3 bg-zinc-900/70 rounded-xl border border-white/[0.08] space-y-1">
                <div className="flex items-center space-x-1.5 text-zinc-300 font-medium text-xs">
                  <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>ERP Baseline Notice</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  {baselineInfo.erpNoticeText}
                </p>
              </div>

              {/* Baseline Section */}
              <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200">Baseline Attendance</span>
                  <button
                    type="button"
                    onClick={handleLoadAIMLBenchmark}
                    className="flex items-center space-x-1 text-[11px] text-zinc-400 hover:text-white transition px-2 py-0.5 rounded-lg bg-zinc-800/80 border border-white/[0.08]"
                    title="Load AIML-3A baseline as of Wed 18 Nov (421 held / 316 present)"
                  >
                    <Pencil className="h-3 w-3 text-zinc-300" />
                    <span>AIML-3A Preset</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Total Held</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 421"
                      value={totalHeldInput}
                      onChange={(e) => setTotalHeldInput(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#090a0f] px-2.5 py-1.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Attended</label>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="e.g. 316"
                      value={presentInput}
                      onChange={(e) => setPresentInput(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#090a0f] px-2.5 py-1.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] text-zinc-400">Official Attendance (%)</label>
                    <span className="text-[10px] text-zinc-500">Optional</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="e.g. 78.64 (from ERP)"
                    value={officialPctInput}
                    onChange={(e) => setOfficialPctInput(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#090a0f] px-2.5 py-1.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Today's Classes */}
              <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200">Today: Thu, 19 Nov</span>
                  <span className="text-[11px] text-zinc-500 font-mono">8 periods/day</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Held Today</label>
                    <div className="flex items-center justify-between bg-[#090a0f] border border-white/[0.08] rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => updateHeldToday(thursdayHeld - 1)}
                        disabled={thursdayHeld <= 0}
                        className="h-6 w-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 flex items-center justify-center transition"
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
                        className="h-6 w-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 flex items-center justify-center transition"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Attended Today</label>
                    <div className="flex items-center justify-between bg-[#090a0f] border border-white/[0.08] rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => updateAttendedToday(thursdayPresent - 1)}
                        disabled={thursdayPresent <= 0}
                        className="h-6 w-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 flex items-center justify-center transition"
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
                        className="h-6 w-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 flex items-center justify-center transition"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-white text-zinc-950 font-semibold py-2.5 text-xs hover:bg-zinc-200 transition shadow-md"
              >
                <span>Calculate Bunks</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div className="flex border-b border-white/[0.08] pb-1.5 mb-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setAuthTab("login"); setAuthError(null); }}
                  className={`mr-3 pb-1 border-b-2 transition ${
                    authTab === "login"
                      ? "border-white text-white"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab("register"); setAuthError(null); }}
                  className={`pb-1 border-b-2 transition ${
                    authTab === "register"
                      ? "border-white text-white"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-0.5">
                  Admission No
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="2025B1531..."
                  className="w-full rounded-xl border border-white/[0.08] bg-[#090a0f] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>

              {authTab === "register" && (
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-0.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#090a0f] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] text-zinc-400 mb-0.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#090a0f] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-white text-zinc-950 font-semibold py-2.5 text-xs hover:bg-zinc-200 transition disabled:opacity-50 mt-1 shadow-md"
              >
                {isLoading ? "Please wait..." : authTab === "login" ? "Sign In" : "Register"}
              </button>
            </form>
          )}
        </div>

        {onOpenFeedback && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onOpenFeedback}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 transition inline-flex items-center space-x-1"
            >
              <HelpCircle className="h-3 w-3" />
              <span>Report bug / Send feedback</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
