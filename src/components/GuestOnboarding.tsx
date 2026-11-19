"use client";

import React, { useState } from "react";
import { ArrowRight, Minus, Plus, Lock, Unlock, AlertCircle } from "lucide-react";
import { UserProfile } from "@/lib/types";

interface GuestOnboardingProps {
  onCompleteGuest: (data: {
    totalHeld: number;
    academicPresent: number;
    thursdayHeld: number;
    thursdayPresent: number;
    targetPercentage: number;
  }) => void;
  onLoginSuccess: (token: string, user: UserProfile) => void;
}

export const GuestOnboarding: React.FC<GuestOnboardingProps> = ({
  onCompleteGuest,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<"guest" | "auth">("guest");
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  // Locked preset state (Default: Sem 3 Wed 18 Nov baseline)
  const [isPresetCustomized, setIsPresetCustomized] = useState(false);
  const [totalHeld, setTotalHeld] = useState<number>(421);
  const [academicPresent, setAcademicPresent] = useState<number>(316);

  // Today's classes: default 8 held, 0 attended
  const [thursdayHeld, setThursdayHeld] = useState<number>(8);
  const [thursdayPresent, setThursdayPresent] = useState<number>(0);
  const [targetPercentage, setTargetPercentage] = useState<number>(75);

  // Auth inputs
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
    onCompleteGuest({
      totalHeld: Math.max(1, Number(totalHeld)),
      academicPresent: Math.max(0, Math.min(Number(totalHeld), Number(academicPresent))),
      thursdayHeld,
      thursdayPresent,
      targetPercentage: Math.max(50, Math.min(100, Number(targetPercentage))),
    });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authTab === "register" && !name.trim()) {
      setAuthError("Full Name is required.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = authTab === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        authTab === "login"
          ? { username: username.trim(), password }
          : { username: username.trim(), password, name: name.trim(), totalHeld, academicPresent };

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
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Minimal Brand */}
        <div className="flex items-center justify-center space-x-2.5 mb-6">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center">
            <img src="/logo.png" alt="AttendX" className="h-full w-full object-contain" />
          </div>
          <div>
            <span className="font-semibold text-base text-white tracking-tight">AttendX</span>
            <span className="text-xs text-zinc-500 ml-1.5 font-normal">ABES</span>
          </div>
        </div>

        {/* Card */}
        <div className="clean-card p-5 border border-zinc-800">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-zinc-900 rounded-lg border border-zinc-800 mb-4 text-xs font-medium">
            <button
              onClick={() => { setMode("guest"); setAuthError(null); }}
              className={`py-1.5 rounded transition ${
                mode === "guest"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Guest Mode
            </button>
            <button
              onClick={() => { setMode("auth"); setAuthError(null); }}
              className={`py-1.5 rounded transition ${
                mode === "auth"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign In
            </button>
          </div>

          {mode === "guest" ? (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              {/* Baseline Section (Locked Preset by default) */}
              <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center space-x-1.5 text-zinc-300 font-medium">
                    {isPresetCustomized ? <Unlock className="h-3.5 w-3.5 text-amber-400" /> : <Lock className="h-3.5 w-3.5 text-zinc-500" />}
                    <span>Baseline: Wed, 18 Nov (Yesterday)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPresetCustomized(!isPresetCustomized)}
                    className="text-[11px] text-zinc-400 hover:text-white underline underline-offset-2"
                  >
                    {isPresetCustomized ? "Reset Preset" : "Change Batch"}
                  </button>
                </div>

                {!isPresetCustomized ? (
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1">
                    <span>Preset: Sem 3 Default</span>
                    <span className="text-white font-medium">421 Held / 316 Attended</span>
                  </div>
                ) : (
                  <div className="space-y-2.5 pt-2">
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Enter your previous day's ERP total numbers (raw lower %).
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-0.5">Total Held</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={totalHeld}
                          onChange={(e) => setTotalHeld(Number(e.target.value))}
                          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-0.5">Present</label>
                        <input
                          type="number"
                          min="0"
                          max={totalHeld}
                          required
                          value={academicPresent}
                          onChange={(e) => setAcademicPresent(Number(e.target.value))}
                          className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Today's Classes (Default: 8 held, 0 attended) */}
              <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200">Today: Thu, 19 Nov</span>
                  <span className="text-[11px] text-zinc-500">Max 8 lecs/day</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Held Today</label>
                    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded p-1">
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
                    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded p-1">
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

              {/* Submit */}
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-white text-zinc-950 font-medium py-2 text-xs hover:bg-zinc-200 transition"
              >
                <span>Calculate Bunks</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div className="flex border-b border-zinc-800 pb-1.5 mb-2 text-xs font-medium">
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

              {authError && (
                <div className="flex items-center space-x-1 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-zinc-400 mb-0.5">
                  Admission No *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="2025B15..."
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>

              {authTab === "register" && (
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-0.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] text-zinc-400 mb-0.5">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-white text-zinc-950 font-medium py-2 text-xs hover:bg-zinc-200 transition disabled:opacity-50 mt-1"
              >
                {isLoading ? "Please wait..." : authTab === "login" ? "Sign In" : "Register"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
