"use client";

import React, { useState } from "react";
import { ArrowRight, User, Lock, Sparkles, CheckCircle2 } from "lucide-react";
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

  // Guest inputs (default Wednesday 18 Nov baseline)
  const [totalHeld, setTotalHeld] = useState(421);
  const [academicPresent, setAcademicPresent] = useState(316);
  const [thursdayHeld, setThursdayHeld] = useState(3);
  const [thursdayPresent, setThursdayPresent] = useState(3);
  const [targetPercentage, setTargetPercentage] = useState(75);

  // Auth inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCompleteGuest({
      totalHeld: Number(totalHeld),
      academicPresent: Number(academicPresent),
      thursdayHeld: Number(thursdayHeld),
      thursdayPresent: Number(thursdayPresent),
      targetPercentage: Number(targetPercentage),
    });
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    try {
      const endpoint = authTab === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        authTab === "login"
          ? { username, password }
          : { username, password, name, totalHeld, academicPresent };

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
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 p-2 shadow-sm mb-4">
            <img src="/logo.png" alt="AttendX Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AttendX</h1>
          <p className="text-sm text-zinc-400 mt-1">Smart Attendance & Safe Bunk Calculator</p>
        </div>

        {/* Card */}
        <div className="clean-card p-6 shadow-xl">
          {/* Top Switcher */}
          <div className="grid grid-cols-2 p-1 bg-zinc-900 rounded-lg border border-zinc-800 mb-6 text-xs font-semibold">
            <button
              onClick={() => { setMode("guest"); setAuthError(null); }}
              className={`py-2 rounded-md transition ${
                mode === "guest"
                  ? "bg-zinc-800 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Quick Guest Mode
            </button>
            <button
              onClick={() => { setMode("auth"); setAuthError(null); }}
              className={`py-2 rounded-md transition ${
                mode === "auth"
                  ? "bg-zinc-800 text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign In / Account
            </button>
          </div>

          {mode === "guest" ? (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div className="text-xs text-zinc-400">
                Enter your current lecture counts to calculate your exact official percentage and safe bunks. Saved privately in your browser.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Total Held (as of Wed)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalHeld}
                    onChange={(e) => setTotalHeld(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">Wednesday total</span>
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
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-zinc-500">Wednesday present</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80 space-y-2">
                <span className="text-xs font-medium text-zinc-300 block">
                  Today's Classes (Thursday 19 Nov)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Held Today</label>
                    <input
                      type="number"
                      min="0"
                      max="8"
                      value={thursdayHeld}
                      onChange={(e) => setThursdayHeld(Number(e.target.value))}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Attended Today</label>
                    <input
                      type="number"
                      min="0"
                      max={thursdayHeld}
                      value={thursdayPresent}
                      onChange={(e) => setThursdayPresent(Number(e.target.value))}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 rounded-lg bg-white text-zinc-950 font-semibold py-2.5 text-sm hover:bg-zinc-200 transition"
              >
                <span>Calculate & View Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="flex border-b border-zinc-800 pb-2 mb-4 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setAuthTab("login")}
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
                  onClick={() => setAuthTab("register")}
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
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Admission No / Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 2024B0131..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              {authTab === "register" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-white text-zinc-950 font-semibold py-2.5 text-sm hover:bg-zinc-200 transition disabled:opacity-50"
              >
                {isLoading ? "Loading..." : authTab === "login" ? "Sign In" : "Register & Sync"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
