"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  RotateCw,
  Lock,
  User,
  Pencil,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle,
  Loader2,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ERPSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportNumbers: (
    held: number,
    present: number,
    buffer?: number,
    officialPct?: number,
    subjects?: any[],
    datewiseAtt?: Record<string, any[]>
  ) => void;
  defaultAdmissionNo?: string;
}

export const ERPSyncModal: React.FC<ERPSyncModalProps> = ({
  isOpen,
  onClose,
  onImportNumbers,
  defaultAdmissionNo = "",
}) => {
  const [step, setStep] = useState<"active_session" | "credentials" | "otp">("credentials");

  const [erpId, setErpId] = useState(defaultAdmissionNo);
  const [isEditingAdmission, setIsEditingAdmission] = useState(!defaultAdmissionNo);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");

  const [sessionState, setSessionState] = useState<any>(null);
  const [otpNotice, setOtpNotice] = useState<string>(
    "A one-time verification code has been dispatched by college ERP to your registered mobile and email."
  );
  const [savedSessionCookie, setSavedSessionCookie] = useState<string | null>(null);
  const [savedSessionUser, setSavedSessionUser] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setSuccessMsg(null);
    setOtp("");

    try {
      const stored = localStorage.getItem("attendx_erp_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.cookie) {
          setSavedSessionCookie(parsed.cookie);
          setSavedSessionUser(parsed.erpId || defaultAdmissionNo);
          setStep("active_session");
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (defaultAdmissionNo) {
      setErpId(defaultAdmissionNo);
      setIsEditingAdmission(false);
    } else {
      setIsEditingAdmission(true);
    }
    setStep("credentials");
  }, [isOpen, defaultAdmissionNo]);

  if (!isOpen) return null;

  const handleApplyAttendance = (data: any) => {
    setSuccessMsg("Attendance successfully synced from ERP!");
    if (data.subjects && Array.isArray(data.subjects)) {
      try {
        localStorage.setItem("attendx_subjects", JSON.stringify(data.subjects));
      } catch (e) {
        console.error(e);
      }
    }

    if (data.erpSessionCookie) {
      try {
        localStorage.setItem(
          "attendx_erp_session",
          JSON.stringify({
            cookie: data.erpSessionCookie,
            erpId: data.erpId || erpId,
            savedAt: Date.now(),
          })
        );
      } catch (e) {
        console.error(e);
      }
    }

    setTimeout(() => {
      onImportNumbers(
        Number(data.totalHeld),
        Number(data.academicPresent),
        Number(data.concessionBuffer || 0),
        data.officialPercentage ? Number(data.officialPercentage) : undefined,
        data.subjects,
        data.datewiseAttendance
      );
      onClose();
    }, 600);
  };

  const handleQuickSync = async () => {
    if (!savedSessionCookie) {
      setStep("credentials");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingText("Fetching live attendance records...");

    try {
      const res = await fetch("/api/erp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refresh_session",
          erpSessionCookie: savedSessionCookie,
          erpId: savedSessionUser || erpId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.expired) {
          localStorage.removeItem("attendx_erp_session");
          setSavedSessionCookie(null);
          setStep("credentials");
          setError("Your previous ERP session has expired. Please sign in to connect.");
          return;
        }
        throw new Error(data.error || "Failed to fetch attendance.");
      }

      handleApplyAttendance(data);
    } catch (err: any) {
      setError(err.message || "Failed to sync attendance.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!erpId.trim() || !password) {
      setError("Please enter both your Admission Number and ERP Password.");
      return;
    }

    setIsLoading(true);
    setLoadingText("Authenticating with ERP...");

    try {
      const res = await fetch("/api/erp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_otp",
          erpId: erpId.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Please verify credentials.");
      }

      if (data.success) {
        handleApplyAttendance(data);
        return;
      }

      if (data.step === "otp_required") {
        setSessionState(data.sessionState);
        if (data.message) setOtpNotice(data.message);
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to ERP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim()) {
      setError("Please enter the OTP received.");
      return;
    }

    setIsLoading(true);
    setLoadingText("Verifying OTP and retrieving records...");

    try {
      const res = await fetch("/api/erp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_otp",
          erpId: erpId.trim(),
          password,
          otp: otp.trim(),
          sessionState,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP code. Please try again.");
      }

      handleApplyAttendance(data);
    } catch (err: any) {
      setError(err.message || "OTP verification failed.");
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
          className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-zinc-300">
              <RotateCw className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                ERP Sync
              </h2>
              <p className="text-xs text-zinc-400">
                Official college ERP synchronization
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl mb-4">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* VIEW 1: ACTIVE SESSION */}
        {step === "active_session" && (
          <div className="space-y-4">
            <div className="p-3.5 bg-zinc-900/70 rounded-xl border border-white/[0.08] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-white">
                    Session Connected
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {savedSessionUser || erpId}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                Your authenticated session is active. Sync latest attendance records in one click.
              </p>
            </div>

            <button
              type="button"
              onClick={handleQuickSync}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-white text-zinc-950 font-semibold py-2.5 text-xs hover:bg-zinc-200 transition disabled:opacity-50 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{loadingText}</span>
                </>
              ) : (
                <>
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Sync Latest Attendance</span>
                </>
              )}
            </button>

            <div className="pt-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("attendx_erp_session");
                  setSavedSessionCookie(null);
                  setStep("credentials");
                }}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 transition"
              >
                Sign In with another ID
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: CREDENTIALS */}
        {step === "credentials" && (
          <form onSubmit={handleRequestOtp} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-300">
                  Admission No / ERP ID
                </label>
                {!isEditingAdmission && defaultAdmissionNo && (
                  <button
                    type="button"
                    onClick={() => setIsEditingAdmission(true)}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center space-x-1"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Change</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  readOnly={!isEditingAdmission && !!defaultAdmissionNo}
                  value={erpId}
                  onChange={(e) => setErpId(e.target.value)}
                  placeholder="2025B1531..."
                  className={`w-full rounded-xl border px-3 py-2 pl-9 text-xs font-mono text-white transition focus:outline-none ${
                    !isEditingAdmission && defaultAdmissionNo
                      ? "bg-zinc-900/60 border-zinc-800 text-zinc-400 cursor-not-allowed"
                      : "bg-zinc-900 border-zinc-700 text-white focus:border-zinc-500"
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-300">
                  ERP Password
                </label>
                <a
                  href="https://erp.abes.ac.in/Login.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center space-x-1 transition"
                >
                  <span>Forgot?</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Portal password"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 pl-9 pr-9 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-white text-zinc-950 font-semibold py-2.5 text-xs hover:bg-zinc-200 transition disabled:opacity-50 shadow-md mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{loadingText}</span>
                </>
              ) : (
                <>
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Connect & Send OTP</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* VIEW 3: OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 bg-zinc-900/80 rounded-xl border border-white/[0.08] space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-zinc-200 font-medium">
                <KeyRound className="h-4 w-4 text-zinc-300 shrink-0" />
                <span>Verification Code Sent</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                {otpNotice}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Enter OTP Code
              </label>
              <input
                type="text"
                autoFocus
                required
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="OTP Code"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-center text-sm font-mono tracking-widest text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-white text-zinc-950 font-semibold py-2.5 text-xs hover:bg-zinc-200 transition disabled:opacity-50 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{loadingText}</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Verify OTP & Sync Attendance</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setError(null);
                }}
                className="text-zinc-400 hover:text-white transition"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isLoading}
                className="text-zinc-400 hover:text-white transition"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
