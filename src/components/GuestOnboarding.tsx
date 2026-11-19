"use client";

import React, { useState } from "react";
import { ArrowRight, Minus, Plus, AlertCircle } from "lucide-react";
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

  // Guest inputs (default Wednesday baseline)
  const [totalHeld, setTotalHeld] = useState<number>(421);
  const [academicPresent, setAcademicPresent] = useState<number>(316);
  const [thursdayHeld, setThursdayHeld] = useState<number>(3);
  const [thursdayPresent, setThursdayPresent] = useState<number>(3);
  const [targetPercentage, setTargetPercentage] = useState<number>(75);

  // Auth inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to ensure attended <= held
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
      setAuthError("Full Name is mandatory for account creation.");
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
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-4 selection:bg-zinc-700">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-7">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 p-2 mb-3">
            <img src="/logo.png" alt="AttendX Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">AttendX</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Bunk Calculator & MT2 Eligibility Tracker</p>
        </div>

        {/* Card */}
        <div className="clean-card p-6 shadow-xl border border-zinc-800/80">
          {/* Top Switcher */}
          <div className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-lg border border-zinc-800/90 mb-5 text-xs font-semibold">
            <button
              onClick={() => { setMode("guest"); setAuthError(null); }}
              className={`py-1.5 rounded-md transition ${
                mode === "guest"
                  ? "bg-zinc-800 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Quick Guest Mode
            </button>
            <button
              onClick={() => { setMode("auth"); setAuthError(null); }}
              className={`py-1.5 rounded-md transition ${
                mode === "auth"
                  ? "bg-zinc-800 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign In / Sync
            </button>
          </div>

          {mode === "guest" ? (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Enter your current lecture counts. Data is stored locally in your browser.
              </p>

              {/* Total Held & Present (as of Wednesday) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Held (as of Wed)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalHeld}
                    onChange={(e) => setTotalHeld(Number(e.target.value))}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-mono text-white focus:border-zinc-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">Wednesday total held</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Present (as of Wed)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalHeld}
                    required
                    value={academicPresent}
                    onChange={(e) => setAcademicPresent(Number(e.target.value))}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-mono text-white focus:border-zinc-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">Wednesday present count</span>
                </div>
              </div>

              {/* Today's Classes with Interactive Steppers (Max 8) */}
              <div className="p-3.5 bg-zinc-900/60 rounded-lg border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-200">Today's Classes (Thursday 19 Nov)</span>
                  <span className="text-[11px] text-zinc-400">Max 8 lecs/day</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Held Today Stepper */}
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Held Today</label>
                    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-md p-1">
                      <button
                        type="button"
                        onClick={() => updateHeldToday(thursdayHeld - 1)}
                        disabled={thursdayHeld <= 0}
                        className="h-7 w-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-800 flex items-center justify-center transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-sm font-bold text-white px-2">
                        {thursdayHeld}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateHeldToday(thursdayHeld + 1)}
                        disabled={thursdayHeld >= 8}
                        className="h-7 w-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-800 flex items-center justify-center transition"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Attended Today Stepper */}
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Attended Today</label>
                    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-md p-1">
                      <button
                        type="button"
                        onClick={() => updateAttendedToday(thursdayPresent - 1)}
                        disabled={thursdayPresent <= 0}
                        className="h-7 w-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-800 flex items-center justify-center transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-sm font-bold text-white px-2">
                        {thursdayPresent}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateAttendedToday(thursdayPresent + 1)}
                        disabled={thursdayPresent >= thursdayHeld}
                        className="h-7 w-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:hover:bg-zinc-800 flex items-center justify-center transition"
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
                className="w-full flex items-center justify-center space-x-2 rounded-lg bg-white text-zinc-950 font-semibold py-2.5 text-sm hover:bg-zinc-200 transition active:scale-[0.99]"
              >
                <span>Calculate & View Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              <div className="flex border-b border-zinc-800 pb-2 mb-3 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setAuthTab("login"); setAuthError(null); }}
                  className={`mr-4 pb-1 border-b-2 transition ${
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
                <div className="flex items-center space-x-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-md">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Admission No with updated 2025B15... placeholder */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Admission No / Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="2025B15..."
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              {/* Full Name (Mandatory for registration) */}
              {authTab === "register" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-white text-zinc-950 font-semibold py-2.5 text-sm hover:bg-zinc-200 transition disabled:opacity-50 mt-1 active:scale-[0.99]"
              >
                {isLoading ? "Please wait..." : authTab === "login" ? "Sign In" : "Register & Sync Profile"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
