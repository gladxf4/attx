"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Globe, Smartphone, RefreshCw, Check, ArrowRight, Info, ExternalLink } from "lucide-react";

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
  const [tab, setTab] = useState<"wrapped" | "manual">("wrapped");
  const [syncStatusText, setSyncStatusText] = useState<string>("Ready • Log in to your college ERP below");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  // Manual 3 numbers fallback
  const [heldInput, setHeldInput] = useState<string>("");
  const [presentInput, setPresentInput] = useState<string>("");
  const [officialPctInput, setOfficialPctInput] = useState<string>("");

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for messages from the wrapped ERP session
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "ATTENDX_SYNC_PROGRESS") {
        setSyncStatusText(data.text || "Synchronizing attendance data...");
        setIsSyncing(true);
      }

      if (data.type === "ATTENDX_SYNC_SUCCESS") {
        setIsSyncing(false);
        setSyncSuccess(true);
        setSyncStatusText("Attendance data retrieved successfully!");

        // Save subjects if available
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
        }, 800);
      }

      if (data.type === "ATTENDX_SYNC_ERROR") {
        setIsSyncing(false);
        setSyncStatusText(`Sync error: ${data.error || "Could not retrieve data"}`);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen, onImportNumbers, onClose]);

  if (!isOpen) return null;

  // Manual calculations
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
    setIsSyncing(true);
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
      <div className="w-full max-w-2xl clean-card p-4 sm:p-5 shadow-2xl relative border border-zinc-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">College ERP Attendance Sync</h3>
            <p className="text-xs text-zinc-400">
              Log into the official ERP portal to automatically extract your verified attendance
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
        <div className="grid grid-cols-2 p-1 bg-zinc-900 rounded-lg border border-zinc-800 my-3 text-xs font-medium">
          <button
            onClick={() => setTab("wrapped")}
            className={`py-1.5 rounded flex items-center justify-center space-x-1.5 transition ${
              tab === "wrapped" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Wrapped ERP Portal</span>
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

        {tab === "wrapped" ? (
          <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
            {/* Status & Action Bar */}
            <div className="p-2.5 bg-zinc-900/90 rounded-lg border border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className={`h-2 w-2 rounded-full ${syncSuccess ? "bg-emerald-400" : isSyncing ? "bg-amber-400 animate-pulse" : "bg-blue-400"}`} />
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
                  disabled={isSyncing}
                  className="px-3 py-1 rounded bg-white text-zinc-950 font-semibold flex items-center space-x-1 text-[11px] hover:bg-zinc-200 transition disabled:opacity-50"
                >
                  <Check className="h-3 w-3" />
                  <span>{isSyncing ? "Syncing..." : "Fetch Attendance Now"}</span>
                </button>
              </div>
            </div>

            {/* In-App Browser Wrapper */}
            <div className="flex-1 w-full min-h-[380px] sm:min-h-[440px] rounded-lg border border-zinc-800 overflow-hidden bg-white relative">
              <iframe
                ref={iframeRef}
                src="/api/erp-proxy/Login.aspx"
                title="College ERP Session"
                className="w-full h-full border-0"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
              />
            </div>

            <p className="text-[11px] text-zinc-500">
              💡 Tip: Enter your ERP ID & password above. Once logged in, your attendance numbers and subject list will sync automatically into AttendX.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5 py-2">
            <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 space-y-1">
              <div className="flex items-center space-x-1.5 text-zinc-300 font-medium text-xs">
                <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span>Notice: ERP Attendance Timing</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-normal">
                ERP displays the latest recorded attendance which may miss today’s lectures if individual professors have not submitted them yet.
              </p>
            </div>

            <p className="text-xs text-zinc-400">
              Enter the 3 numbers shown on your ERP portal:
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
