"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
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
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

interface ERPSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportNumbers: (
    held: number,
    present: number,
    buffer?: number,
    officialPct?: number
  ) => void;
  defaultAdmissionNo?: string;
}

export const ERPSyncModal: React.FC<ERPSyncModalProps> = ({
  isOpen,
  onClose,
  onImportNumbers,
  defaultAdmissionNo = "",
}) => {
  // Step state: 'active_session' (if saved) | 'credentials' | 'otp'
  const [step, setStep] = useState<"active_session" | "credentials" | "otp">("credentials");

  // Inputs
  const [erpId, setErpId] = useState(defaultAdmissionNo);
  const [isEditingAdmission, setIsEditingAdmission] = useState(!defaultAdmissionNo);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");

  // Session state from step 1 for step 2 verification
  const [sessionState, setSessionState] = useState<any>(null);
  const [savedSessionCookie, setSavedSessionCookie] = useState<string | null>(null);
  const [savedSessionUser, setSavedSessionUser] = useState<string | null>(null);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load existing session on open
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

    // Default to credentials if no valid session
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
        data.officialPercentage ? Number(data.officialPercentage) : undefined
      );
      onClose();
    }, 700);
  };

  // 1. One-click sync with active session
  const handleQuickSync = async () => {
    if (!savedSessionCookie) {
      setStep("credentials");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingText("Querying live attendance from ERP...");

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

  // 2. Request OTP (Step 1)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!erpId.trim() || !password) {
      setError("Please enter both your Admission Number and ERP Password.");
      return;
    }

    setIsLoading(true);
    setLoadingText("Authenticating credentials with ERP...");

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
        throw new Error(data.error || "Authentication failed. Please verify your credentials.");
      }

      // If user immediately authenticated (staff or session bypassed OTP)
      if (data.success) {
        handleApplyAttendance(data);
        return;
      }

      // OTP Dispatched
      if (data.step === "otp_required") {
        setSessionState(data.sessionState);
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to ERP.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify OTP (Step 2)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim()) {
      setError("Please enter the OTP received on your mobile or email.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md clean-card border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800/80 transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="h-4 w-4 fill-amber-400" />
            </div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              ERP Direct Connector
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Official college ERP synchronization without scrapers or manual entry.
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg mb-4">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* VIEW 1: ACTIVE SESSION VIEW (1-Click Instant Sync) */}
        {step === "active_session" && (
          <div className="space-y-4">
            <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-white">
                    ERP Session Authenticated
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {savedSessionUser || erpId}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                Your authenticated session is active. Sync the latest attendance records directly from the college ERP in one click without re-entering your password or OTP.
              </p>
            </div>

            <button
              type="button"
              onClick={handleQuickSync}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-white text-zinc-950 font-semibold py-2.5 text-xs hover:bg-zinc-200 transition disabled:opacity-50 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{loadingText}</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>Sync Latest Attendance Now</span>
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
                className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center space-x-1 transition"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Switch Account / Sign In with Another ID</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: CREDENTIALS INPUT FORM (Step 1) */}
        {step === "credentials" && (
          <form onSubmit={handleRequestOtp} className="space-y-3.5">
            {/* Admission No / ERP ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-300">
                  Admission No / ERP ID *
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
                  placeholder="2025B15... or 2024B..."
                  className={`w-full rounded-lg border px-3 py-2 pl-9 text-xs font-mono text-white transition focus:outline-none ${
                    !isEditingAdmission && defaultAdmissionNo
                      ? "bg-zinc-900/60 border-zinc-800 text-zinc-400 cursor-not-allowed"
                      : "bg-zinc-900 border-zinc-700 text-white focus:border-zinc-500"
                  }`}
                />
              </div>
            </div>

            {/* ERP Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-300">
                  ERP Password *
                </label>
                <a
                  href="https://erp.abes.ac.in/Login.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center space-x-1 transition"
                >
                  <span>Forgot Password?</span>
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
                  placeholder="Enter your ERP portal password"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 pl-9 pr-9 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition"
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

            <p className="text-[11px] text-zinc-500 leading-normal">
              Your credentials are used solely to negotiate a secure session with the official college ERP and are never permanently stored.
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-white text-zinc-950 font-semibold py-2.5 text-xs hover:bg-zinc-200 transition disabled:opacity-50 shadow-md mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{loadingText}</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>Connect & Send OTP</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* VIEW 3: OTP VERIFICATION FORM (Step 2) */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-zinc-200 font-medium">
                <KeyRound className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Verification Code Sent</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                A one-time password has been sent by the college ERP to your registered mobile number and email.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Enter OTP Code *
              </label>
              <input
                type="text"
                autoFocus
                required
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter received OTP"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-center text-sm font-mono tracking-widest text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-white text-zinc-950 font-semibold py-2.5 text-xs hover:bg-zinc-200 transition disabled:opacity-50 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{loadingText}</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
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
                ← Back to Login
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
      </div>
    </div>
  );
};
