"use client";

import { Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Stepper } from "@/components/ui/Controls";
import { AcademicCalendar, CalendarPrefs, DEFAULT_CALENDAR } from "@/lib/academicCalendar";
import { clampInt, officialPresentFrom } from "@/lib/attendanceEngine";
import { isValidISO } from "@/lib/dates";
import { AttendanceInput } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  attendance: AttendanceInput;
  cal: AcademicCalendar;
  hasSubjects: boolean;
  onSave: (att: AttendanceInput, prefs: CalendarPrefs) => void;
}

export function SettingsSheet({ open, onClose, attendance, cal, hasSubjects, onSave }: Props) {
  const [held, setHeld] = useState("");
  const [attended, setAttended] = useState("");
  const [officialPct, setOfficialPct] = useState("");
  const [target, setTarget] = useState(75);
  const [cutoffDate, setCutoffDate] = useState(cal.cutoffDate);
  const [cutoffLabel, setCutoffLabel] = useState(cal.cutoffLabel);
  const [lpd, setLpd] = useState(cal.lecturesPerDay);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setHeld(String(attendance.baselineHeld));
    setAttended(String(attendance.baselinePresent));
    setOfficialPct("");
    setTarget(attendance.targetPercentage);
    setCutoffDate(cal.cutoffDate);
    setCutoffLabel(cal.cutoffLabel);
    setLpd(cal.lecturesPerDay);
    setError(null);
  }, [open, attendance, cal]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const h = clampInt(held, 0, 5000, -1);
    const a = clampInt(attended, 0, 5000, -1);
    if (h < 0 || a < 0 || a > h) {
      setError("Attended can't be more than held.");
      return;
    }
    if (!isValidISO(cutoffDate)) {
      setError("Pick a valid cutoff date.");
      return;
    }
    const pctNum = officialPct.trim() ? Number(officialPct) : undefined;
    if (pctNum !== undefined && (!Number.isFinite(pctNum) || pctNum < 0 || pctNum > 100)) {
      setError("Overall % must be between 0 and 100.");
      return;
    }
    onSave(
      {
        ...attendance,
        baselineHeld: h,
        baselinePresent: officialPresentFrom(h, a, pctNum),
        targetPercentage: clampInt(target, 50, 100, 75),
      },
      { cutoffDate, cutoffLabel: cutoffLabel.trim() || DEFAULT_CALENDAR.cutoffLabel, lecturesPerDay: lpd }
    );
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      size="md"
      icon={<Settings2 className="h-5 w-5" />}
      title="Settings"
      description="Adjust your numbers and the cutoff you're planning for."
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button type="submit" form="settings-form" className="btn btn-light">
            Save
          </button>
        </div>
      }
    >
      <form id="settings-form" onSubmit={save} className="space-y-6 pt-1">
        {error && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}

        <fieldset className="space-y-3">
          <legend className="eyebrow mb-3">Attendance before today</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="s-held">Lectures held</label>
              <input id="s-held" className="field num" inputMode="numeric" value={held} onChange={(e) => setHeld(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="s-att">Attended</label>
              <input id="s-att" className="field num" inputMode="numeric" value={attended} onChange={(e) => setAttended(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="s-pct">
              Overall % on the ERP <span className="text-zinc-600">· optional</span>
            </label>
            <input
              id="s-pct"
              className="field num"
              inputMode="decimal"
              value={officialPct}
              onChange={(e) => setOfficialPct(e.target.value)}
              placeholder="Only if it differs from attended ÷ held"
            />
          </div>
          {hasSubjects && <p className="text-xs text-zinc-500">These are overwritten on every ERP sync.</p>}
        </fieldset>

        <fieldset>
          <legend className="eyebrow mb-3">Target</legend>
          <div className="inset-panel p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-300">Minimum attendance</span>
              <span className="num font-semibold text-white">{target}%</span>
            </div>
            <input type="range" min={50} max={95} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="range mt-3" aria-label="Target percentage" />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="eyebrow mb-3">Next cutoff</legend>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="field-label" htmlFor="s-cut">Exams begin on</label>
              <input id="s-cut" type="date" className="field [color-scheme:dark]" value={cutoffDate} onChange={(e) => setCutoffDate(e.target.value)} />
            </div>
            <div className="w-28">
              <label className="field-label" htmlFor="s-label">Name</label>
              <input id="s-label" className="field" maxLength={24} value={cutoffLabel} onChange={(e) => setCutoffLabel(e.target.value)} />
            </div>
          </div>
          <div className="inset-panel flex items-center justify-between gap-3 p-4">
            <span className="text-sm text-zinc-300">Lectures per day</span>
            <Stepper value={lpd} min={1} max={12} onChange={setLpd} size="sm" />
          </div>
        </fieldset>
      </form>
    </Sheet>
  );
}
