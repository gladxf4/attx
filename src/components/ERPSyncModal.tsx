"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Zap, Globe, Smartphone, Lock, User, RefreshCw, Check, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

interface ERPSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportNumbers: (held: number, present: number, buffer?: number, officialPct?: number) => void;
}

export const ERPSyncModal: React.FC<ERPSyncModalProps> = ({
  isOpen,
  onClose,
  onImportNumbers,
}) => {
  const [tab, setTab] = useState<"direct" | "wrapped" | "manual">("direct");

  // Direct Connect Form (Our UI)
  const [erpId, setErpId] = useState("");
  const [password, setPassword] = useState("");
  const [semId, setSemId] = useState("CS03");
  const [isConnecting, setIsConnecting] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);
  const [connectStepText, setConnectStepText] = useState("");

  // Wrapped portal state
  const [syncStatusText, setSyncStatusText] = useState<string>("Ready • Log in to your college ERP below");
  const [isIframeSyncing, setIsIframeSyncing] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Manual fallback inputs
  const [heldInput, setHeldInput] = useState<string>("");
  const [presentInput, setPresentInput] = useState<string>("");
  const [officialPctInput, setOfficialPctInput] = useState<string>("");

  // Listen for messages from wrapped iframe if used
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "ATTENDX_SYNC_PROGRESS") {
        setSyncStatusText(data.text || "Synchronizing attendance data...");
        setIsIframeSyncing(true);
      }

      if (data.type === "ATTENDX_SYNC_SUCCESS") {
        setIsIframeSyncing(false);
        setSyncStatusText("Attendance data retrieved successfully!");

        if (data.subjects && Array.isArray(data.subjects) && data.subjects.length > 0) {
          try {
            localStorage.setItem("attendx_subjects", JSON.stringify(data.subjects));
          } catch (e) {
            console.error("Failed to save subjects to storage", e);
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
        }, 600);
      }

      if (data.type === "ATTENDX_SYNC_ERROR") {
        setIsIframeSyncing(false);
        setSyncStatusText(`Sync error: ${data.error || "Could not retrieve data"}`);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen, onImportNumbers, onClose]);

  if (!isOpen) return null;

  // Direct Connect Handler (Native AttendX UI interacting with ERP backend)
  const handleDirectConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectError(null);

    if (!erpId.trim() || !password) {
      setDirectError("Please enter both ERP ID and Password.");
      return;
    }

    setIsConnecting(true);
    setConnectStepText("Connecting to college ERP backend...");

    try {
      setConnectStepText("Authenticating session tokens with ERP...");
      const res = await fetch("/api/erp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          erpId: erpId.trim(),
          password,
          semId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to authenticate with ERP");
      }

      setConnectStepText("Attendance records retrieved successfully!");

      // Save subject list
      if (data.subjects && Array.isArray(data.subjects)) {
        try {
          localStorage.setItem("attendx_subjects", JSON.stringify(data.subjects));
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
    } catch (err: any) {
      setDirectError(err.message || "Failed to sync from ERP.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Manual fallback calculations
  const heldNum = Number(heldInput) || 0;
  const presNum = Number(presentInput) || 0;
  const offPctNum = Number(officialPctInput) || 0;

  const rawPct = heldNum > 0 ? (presNum / heldNum) * 100 : 0;
  const effectivePres = offPctNum > 0 ? Math.round((offPctNum / 100.0) * heldNum) : presNum;
  const detectedBuffer = Math.max(0, effectivePres - presNum);
  const higherPct = heldNum > 0 ? ((presNum + detectedBuffer) / heldNum) * 100 : 0;

  const handleApplyManual = () => {
    if (heldNum <= 0 || presNum < 0) return;
    onImportNumbers(heldNum, presNum, detectedBuffer, offPctNum > 0 ? offPctNum : undefined);
    onClose();
  };

  const handleTriggerIframeSync = () => {
    setIsIframeSyncing(true);
    setSyncStatusText("Requesting attendance from current ERP session...");
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ action: "TRIGGER_SYNC" }, "*");
    }
  };

  const handleReloadIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = "/api/erp-proxy/Login.aspx";
      setSyncStatusText("Portal refreshed. Please log in.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-xl clean-card p-5 sm:p-6 shadow-2xl relative border border-zinc-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Direct ERP Attendance Sync</h3>
            <p className="text-xs text-zinc-400">
              Direct connection to the college ERP backend — zero scrapers, pure native UI
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-1 bg-zinc-900 rounded-lg border border-zinc-800 my-3 text-xs font-medium">
          <button
            onClick={() => setTab("direct")}
            className={`py-1.5 rounded flex items-center justify-center space-x-1.5 transition ${
              tab === "direct" ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Direct Connect</span>
          </button>
          <button
            onClick={() => setTab("wrapped")}
            className={`py-1.5 rounded flex items-center justify-center space-x-1.5 transition ${
              tab === "wrapped" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Portal View</span>
          </button>
          <button
            onClick={() => setTab("manual")}
            className={`py-1.5 rounded flex items-center justify-center space-x-1.5 transition ${
              tab === "manual" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Manual 3 Numbers</span>
          </button>
        </div>

        {/* TAB 1: Direct Connect (Our native UI interacting with ERP backend) */}
        {tab === "direct" && (
          <form onSubmit={handleDirectConnect} className="space-y-4 py-1">
            <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
              AttendX acts as a native ERP client: your credentials authenticate directly against the official ERP authentication endpoints and instantly retrieve your live attendance metrics and subject records.
            </div>

            {directError && (
              <div className="flex items-center space-x-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{directError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Admission No / ERP ID *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={erpId}
                    onChange={(e) => setErpId(e.target.value)}
                    placeholder="2025B15... or 2024B..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  ERP Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Current Semester
                </label>
                <select
                  value={semId}
                  onChange={(e) => setSemId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                >
                  <option value="CS03">CS03 — 3rd Semester (Current Regular)</option>
                  <option value="CS05">CS05 — 5th Semester</option>
                  <option value="CS07">CS07 — 7th Semester</option>
                  <option value="CS01">CS01 — 1st Semester</option>
                </select>
              </div>
            </div>

            {isConnecting && (
              <div className="flex items-center space-x-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>{connectStepText}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isConnecting}
              className="w-full flex items-center justify-center space-x-2 rounded-lg bg-white text-zinc-950 font-medium py-2.5 text-xs hover:bg-zinc-200 transition disabled:opacity-50 shadow-md"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Connecting to ERP Backend...</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>Connect & Sync from ERP</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: Wrapped Portal View (In-App Browser fallback) */}
        {tab === "wrapped" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
            <div className="p-2.5 bg-zinc-900/90 rounded-lg border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className={`h-2 w-2 rounded-full ${isIframeSyncing ? "bg-amber-400 animate-pulse" : "bg-blue-400"}`} />
                <span className="text-zinc-300 font-medium truncate">{syncStatusText}</span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleReloadIframe}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center space-x-1 text-[11px] transition"
                  title="Reload ERP login screen"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reload</span>
                </button>
                <button
                  type="button"
                  onClick={handleTriggerIframeSync}
                  disabled={isIframeSyncing}
                  className="px-3 py-1 rounded bg-white text-zinc-950 font-semibold flex items-center space-x-1 text-[11px] hover:bg-zinc-200 transition disabled:opacity-50"
                >
                  <Check className="h-3 w-3" />
                  <span>{isIframeSyncing ? "Syncing..." : "Fetch Attendance"}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 w-full min-h-[380px] rounded-lg border border-zinc-800 overflow-hidden bg-white relative">
              <iframe
                ref={iframeRef}
                src="/api/erp-proxy/Login.aspx"
                title="College ERP Session"
                className="w-full h-full border-0"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
              />
            </div>
          </div>
        )}

        {/* TAB 3: Manual 3 Numbers */}
        {tab === "manual" && (
          <div className="space-y-3.5 py-2">
            <p className="text-xs text-zinc-400">
              Enter the 3 numbers shown on your official ERP portal:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-0.5">
                  1. Total Held (bottom row)
                </label>
                <input
                  type="number"
                  value={heldInput}
                  onChange={(e) => setHeldInput(e.target.value)}
                  placeholder="e.g. 420"
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-0.5">
                  2. Present (bottom row)
                </label>
                <input
                  type="number"
                  value={presentInput}
                  onChange={(e) => setPresentInput(e.target.value)}
                  placeholder="e.g. 315"
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-0.5">
                3. Official Attendance % (shown at bottom of ERP page)
              </label>
              <input
                type="number"
                step="0.01"
                value={officialPctInput}
                onChange={(e) => setOfficialPctInput(e.target.value)}
                placeholder="e.g. 79.01"
                className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
              />
            </div>

            {heldNum > 0 && presNum >= 0 && (
              <div className="p-3 bg-zinc-900 rounded-md border border-zinc-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Subject Table Raw %:</span>
                  <span className="font-mono text-zinc-400">{rawPct.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Official Attendance % (Bottom of ERP):</span>
                  <span className="font-mono font-bold text-white">{higherPct.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400 text-[11px] pt-1 border-t border-zinc-800/80">
                  <span>Status:</span>
                  <span className="font-mono text-emerald-400 font-medium">Calibrated with Official ERP</span>
                </div>
              </div>
            )}

            <button
              onClick={handleApplyManual}
              disabled={heldNum <= 0 || presNum < 0}
              className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-white text-zinc-950 font-medium py-2 text-xs hover:bg-zinc-200 transition disabled:opacity-40"
            >
              <span>Apply Calibrated Numbers</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
