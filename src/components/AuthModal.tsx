"use client";

import React, { useState } from "react";
import { X, LogIn, UserPlus, Lock, User, Sparkles, AlertCircle } from "lucide-react";
import { UserProfile, AttendanceMetrics } from "@/lib/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, user: UserProfile, metrics?: AttendanceMetrics) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("AIML-3A");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        tab === "login"
          ? { username, password }
          : { username, password, name, branch };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      onAuthSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl glass-card border border-slate-700 p-6 sm:p-7 shadow-2xl relative glow-primary">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 mb-6 pb-2">
          <button
            onClick={() => { setTab("login"); setError(null); }}
            className={`pb-2 text-sm font-semibold transition border-b-2 mr-6 ${
              tab === "login"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("register"); setError(null); }}
            className={`pb-2 text-sm font-semibold transition border-b-2 ${
              tab === "register"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center space-x-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admission No / ERP ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. 2024B0131000 or email"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {tab === "register" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Branch / Year
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. AIML-3A, CSE-2, ECE-3"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </>
          )}

          <p className="text-[11px] text-slate-500">
            {tab === "register"
              ? "Your baseline attendance data will be saved securely to Neon DB."
              : "Sign in to sync your saved total lectures and custom settings across devices."}
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 transition disabled:opacity-50"
          >
            {tab === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            <span>{isLoading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
