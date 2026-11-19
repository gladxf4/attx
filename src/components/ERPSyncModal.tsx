"use client";

import React, { useState } from "react";
import { X, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";

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
  const [copied, setCopied] = useState(false);
  const [pasteData, setPasteData] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  // The 1-click sync script for ERP console
  const syncScript = `
(async () => {
  try {
    const sem = $('#MainContent_ddlsem').val() || 'CS03';
    const sRes = await fetch('Default.aspx/getStudentAtt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ StudentDashBAL: { semid: sem, mode: 'MyAttendance' } })
    });
    const sJson = JSON.parse((await sRes.json()).d);
    const totalRow = sJson[sJson.length - 1];
    
    const eRes = await fetch('Default.aspx/getEventAtt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ StudentDashBAL: { semid: sem, mode: 'MyEventAttendance' } })
    });
    const eJson = JSON.parse((await eRes.json()).d);
    const higherPct = eJson[0].PER;
    const concession = eJson[1]?.Numerator || 0;

    const payload = JSON.stringify({
      held: parseInt(totalRow.NoOfLecture),
      present: parseInt(totalRow.Present),
      higherPercentage: higherPct,
      concession: concession
    });
    
    navigator.clipboard.writeText(payload);
    alert('✅ AttendX Sync Data copied to clipboard! Switch back to AttendX and paste it.');
  } catch(e) {
    alert('Sync error: ' + e.message);
  }
})();
`.trim();

  const handleCopyScript = () => {
    navigator.clipboard.writeText(syncScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleParsePaste = () => {
    setParseError(null);
    try {
      const parsed = JSON.parse(pasteData.trim());
      if (parsed.held && parsed.present !== undefined) {
        onImportNumbers(parsed.held, parsed.present, parsed.concession || 16);
        onClose();
        return;
      }
      throw new Error("Missing 'held' or 'present' fields.");
    } catch {
      setParseError("Invalid format. Please run the sync code on your ERP tab and paste the copied result.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg clean-card p-6 shadow-2xl relative border border-zinc-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-sm font-semibold text-white mb-1">Sync Directly from ABES ERP</h3>
        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
          Because ERP blocks external iframes via security policies, you can sync your exact attendance records and concession buffer in 1 click using this script.
        </p>

        {/* Step 1 */}
        <div className="space-y-3">
          <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 space-y-2">
            <span className="text-xs font-medium text-zinc-200 block">
              Step 1: Copy ERP Sync Snippet
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-400 truncate font-mono">
                Runs on your open ERP tab to extract total, present, and higher %
              </span>
              <button
                onClick={handleCopyScript}
                className="shrink-0 flex items-center space-x-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 text-xs transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy Code"}</span>
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 space-y-2">
            <span className="text-xs font-medium text-zinc-200 block">
              Step 2: Paste in ERP Console
            </span>
            <p className="text-[11px] text-zinc-400 leading-normal">
              On your logged-in ERP Attendance page, press <code className="bg-zinc-800 px-1 rounded text-zinc-200">F12</code> &rarr; Console, paste, and press Enter. It automatically copies your sync payload.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 space-y-2">
            <span className="text-xs font-medium text-zinc-200 block">
              Step 3: Paste Copied Payload Here
            </span>
            <input
              type="text"
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              placeholder='Paste JSON here (e.g. {"held":424,"present":319...})'
              className="w-full rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none"
            />
            {parseError && (
              <span className="text-[11px] text-rose-400 block">{parseError}</span>
            )}
            <button
              onClick={handleParsePaste}
              disabled={!pasteData.trim()}
              className="w-full rounded bg-white text-zinc-950 font-medium py-1.5 text-xs hover:bg-zinc-200 transition disabled:opacity-40"
            >
              Apply ERP Sync
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
