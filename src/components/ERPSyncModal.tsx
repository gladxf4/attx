"use client";

import React, { useState } from "react";
import { X, Smartphone, ClipboardPaste, Terminal, Check, ArrowRight, Info } from "lucide-react";

interface ERPSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportNumbers: (held: number, present: number, buffer?: number) => void;
}

export const ERPSyncModal: React.FC<ERPSyncModalProps> = ({
  isOpen,
  onClose,
  onImportNumbers,
}) => {
  const [tab, setTab] = useState<"mobile" | "paste" | "script">("mobile");

  // Mobile 3-number match
  const [heldInput, setHeldInput] = useState<string>("");
  const [presentInput, setPresentInput] = useState<string>("");
  const [officialPctInput, setOfficialPctInput] = useState<string>("");

  // Paste raw text
  const [rawText, setRawText] = useState<string>("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Script copy
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Auto calculate buffer from 3 numbers
  const heldNum = Number(heldInput) || 0;
  const presNum = Number(presentInput) || 0;
  const offPctNum = Number(officialPctInput) || 0;

  const rawPct = heldNum > 0 ? (presNum / heldNum) * 100 : 0;
  const effectivePres = offPctNum > 0 ? Math.round((offPctNum / 100.0) * heldNum) : presNum;
  const detectedBuffer = Math.max(0, effectivePres - presNum);
  const higherPct = heldNum > 0 ? ((presNum + detectedBuffer) / heldNum) * 100 : 0;

  const handleApplyMobileMatch = () => {
    if (heldNum <= 0 || presNum < 0) return;
    onImportNumbers(heldNum, presNum, detectedBuffer);
    onClose();
  };

  const handleParseRawText = () => {
    setPasteError(null);
    try {
      // Find "Attendance % : 79.01"
      const pctMatch = rawText.match(/Attendance\s*%\s*:\s*([\d\.]+)/i);
      const parsedPct = pctMatch ? parseFloat(pctMatch[1]) : null;

      // Find "Total:- 424 319 105" or "Total 424 319"
      const totalMatch = rawText.match(/Total[:\s\-]+(\d+)\s+(\d+)\s+(\d+)/i);
      if (totalMatch) {
        const h = parseInt(totalMatch[1]);
        const p = parseInt(totalMatch[2]);
        const eff = parsedPct ? Math.round((parsedPct / 100.0) * h) : p;
        const buf = Math.max(0, eff - p);
        onImportNumbers(h, p, buf);
        onClose();
        return;
      }
      throw new Error("Could not find Total row in pasted text.");
    } catch (e: any) {
      setPasteError("Could not auto-detect attendance. Try using the 3 Numbers tab instead.");
    }
  };

  // Desktop snippet
  const desktopSnippet = `(async()=>{const s=$('#MainContent_ddlsem').val()||'CS03';const r=await fetch('Default.aspx/getStudentAtt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({StudentDashBAL:{semid:s,mode:'MyAttendance'}})});const t=(await r.json()).d;const j=JSON.parse(t);const o=j[j.length-1];const er=await fetch('Default.aspx/getEventAtt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({StudentDashBAL:{semid:s,mode:'MyEventAttendance'}})});const ej=JSON.parse((await er.json()).d);navigator.clipboard.writeText(JSON.stringify({held:parseInt(o.NoOfLecture),present:parseInt(o.Present),concession:ej[1]?.Numerator||16}));alert('Copied AttendX Data!');})();`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md clean-card p-5 sm:p-6 shadow-2xl relative border border-zinc-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-sm font-semibold text-white mb-1">Sync from College ERP</h3>
        <p className="text-xs text-zinc-400 mb-4">
          Match your official numbers without needing a laptop console.
        </p>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-1 bg-zinc-900 rounded-lg border border-zinc-800 mb-4 text-xs font-medium">
          <button
            onClick={() => setTab("mobile")}
            className={`py-1.5 rounded flex items-center justify-center space-x-1 transition ${
              tab === "mobile" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smartphone className="h-3 w-3" />
            <span>3 Numbers</span>
          </button>
          <button
            onClick={() => setTab("paste")}
            className={`py-1.5 rounded flex items-center justify-center space-x-1 transition ${
              tab === "paste" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ClipboardPaste className="h-3 w-3" />
            <span>Paste Text</span>
          </button>
          <button
            onClick={() => setTab("script")}
            className={`py-1.5 rounded flex items-center justify-center space-x-1 transition ${
              tab === "script" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Terminal className="h-3 w-3" />
            <span>Desktop</span>
          </button>
        </div>

        {tab === "mobile" && (
          <div className="space-y-3.5">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter the numbers displayed on your ERP Attendance screen:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-0.5">
                  1. Total Held
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
                  2. Present
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
                3. Official % (shown on ERP banner)
              </label>
              <input
                type="number"
                step="0.01"
                value={officialPctInput}
                onChange={(e) => setOfficialPctInput(e.target.value)}
                placeholder="e.g. 79.0"
                className="w-full rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
              />
            </div>

            {/* Live Calculation Preview */}
            {heldNum > 0 && presNum >= 0 && (
              <div className="p-3 bg-zinc-900 rounded-md border border-zinc-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Raw Academic %:</span>
                  <span className="font-mono text-zinc-400">{rawPct.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Official Attendance %:</span>
                  <span className="font-mono font-bold text-white">{higherPct.toFixed(2)}%</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400 text-[11px] pt-1 border-t border-zinc-800/80">
                  <span>Status:</span>
                  <span className="font-mono text-emerald-400 font-medium">Calibrated with Official ERP</span>
                </div>
              </div>
            )}

            <button
              onClick={handleApplyMobileMatch}
              disabled={heldNum <= 0 || presNum < 0}
              className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-white text-zinc-950 font-medium py-2 text-xs hover:bg-zinc-200 transition disabled:opacity-40"
            >
              <span>Sync Numbers</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {tab === "paste" && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 leading-relaxed">
              On your phone, select all text on your ERP attendance page &rarr; Copy &rarr; Paste here:
            </p>

            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste copied ERP page text here..."
              className="w-full rounded border border-zinc-800 bg-zinc-900 p-2 text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
            />

            {pasteError && (
              <span className="text-[11px] text-rose-400 block">{pasteError}</span>
            )}

            <button
              onClick={handleParseRawText}
              disabled={!rawText.trim()}
              className="w-full rounded-lg bg-white text-zinc-950 font-medium py-2 text-xs hover:bg-zinc-200 transition disabled:opacity-40"
            >
              Auto-Extract & Sync
            </button>
          </div>
        )}

        {tab === "script" && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400 leading-relaxed">
              For laptops: Open ERP &rarr; F12 &rarr; Console, paste this snippet:
            </p>

            <div className="relative">
              <pre className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 overflow-x-auto max-h-24">
                {desktopSnippet}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(desktopSnippet);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="mt-2 w-full flex items-center justify-center space-x-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-1.5 text-xs transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : null}
                <span>{copied ? "Copied Snippet!" : "Copy Snippet"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
