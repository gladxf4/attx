"use client";

import React, { useState } from "react";
import { X, LogIn, UserPlus, Lock, User, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
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
  const [branch, setBranch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === "register" && !name.trim()) {
      setError("Full Name is mandatory.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        tab === "login"
          ? { username: username.trim(), password }
          : { username: username.trim(), password, name: name.trim(), branch: branch.trim() };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md apple-card bg-[#0e0f17] p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 hover:text-white hover:bg-white/[0.06] transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Tab Toggle */}
        <div className="flex border-b border-white/[0.08] mb-6 pb-2">
          <button
            onClick={() => { setTab("login"); setError(null); }}
            className={`pb-2 text-sm font-semibold transition border-b-2 mr-6 ${
              tab === "login"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab("register"); setError(null); }}
            className={`pb-2 text-sm font-semibold transition border-b-2 ${
              tab === "register"
                ? "border-white text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center space-x-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Admission No / ERP ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="2025B1531..."
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/[0.2] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/[0.2] focus:outline-none"
              />
            </div>
          </div>

          {tab === "register" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/[0.2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Branch / Section (Optional)
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. AIML-3A, CSE-2"
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-white/[0.2] focus:outline-none"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-white py-2.5 text-xs font-semibold text-zinc-950 shadow-md hover:bg-zinc-200 transition disabled:opacity-50"
          >
            {tab === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            <span>{isLoading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
