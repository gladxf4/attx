"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Lock, Plus, RotateCcw, Undo2, X } from "lucide-react";
import { useState } from "react";
import { Meter, Segmented, Stepper } from "@/components/ui/Controls";
import { isLabSubject } from "@/lib/attendanceEngine";
import { longDate } from "@/lib/dates";
import { DatewiseSubjectLog, SubjectRecord } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  today: string;
  lecturesPerDay: number;
  closedReason?: string;
  erpLogs: DatewiseSubjectLog[];
  erpTotals: { held: number; present: number };
  todayTotals: { held: number; present: number };
  subjects: SubjectRecord[];
  onUpdateSubjects: (s: SubjectRecord[]) => void;
  onSetSimpleToday: (held: number, present: number) => void;
}

const isLab = (s: { code?: string; name?: string; isLab?: boolean }) => !!s.isLab || isLabSubject(s.code, s.name);

export function TodayView(p: Props) {
  const [filter, setFilter] = useState<"all" | "lectures" | "labs">("all");
  const [showMarked, setShowMarked] = useState(false);

  const manualHeld = p.subjects.reduce((a, s) => a + (s.todayHeld || 0), 0);
  const slotsLeft = Math.max(0, p.lecturesPerDay - p.erpTotals.held - manualHeld);
  const unmarked = Math.max(0, p.lecturesPerDay - p.todayTotals.held);
  const erpCodes = new Set(p.erpLogs.map((l) => (l.code || "").trim()));

  const mark = (code: string, dHeld: number, dPres: number) => {
    p.onUpdateSubjects(
      p.subjects.map((s) => {
        if (s.code !== code) return s;
        const h = s.todayHeld || 0;
        const pr = s.todayPresent || 0;
        const nh = Math.max(0, Math.min(h + slotsLeft, h + dHeld));
        const np = Math.max(0, Math.min(nh, pr + dPres));
        return { ...s, todayHeld: nh, todayPresent: np };
      })
    );
  };

  const visible = p.subjects.filter((s) => {
    if (!showMarked && erpCodes.has((s.code || "").trim()) && !(s.todayHeld || 0)) return false;
    if (filter === "labs") return isLab(s);
    if (filter === "lectures") return !isLab(s);
    return true;
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
      <section className="card card-pad lg:col-span-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Today</p>
            <h2 className="mt-1 text-3xl font-extrabold text-white sm:text-4xl">{longDate(p.today)}</h2>
            {p.closedReason ? (
              <p className="mt-1.5 text-sm text-zinc-400">{p.closedReason} — mark anything that still happened.</p>
            ) : (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {p.erpTotals.held > 0 && (
                  <span className="chip chip-neutral num">
                    {p.erpTotals.held} of {p.lecturesPerDay} on the ERP
                  </span>
                )}
                {unmarked > 0 ? (
                  <span className="chip chip-warn num">{unmarked} unmarked</span>
                ) : (
                  <span className="chip chip-safe">All {p.lecturesPerDay} marked</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="num font-display text-3xl font-extrabold text-white">
                {p.todayTotals.present}
                <span className="text-lg text-zinc-500">/{p.todayTotals.held}</span>
              </p>
              <p className="text-xs text-zinc-500">attended / marked</p>
            </div>
            {manualHeld > 0 && (
              <button
                type="button"
                className="icon-btn"
                title="Clear periods you marked"
                aria-label="Clear periods you marked"
                onClick={() => p.onUpdateSubjects(p.subjects.map((s) => ({ ...s, todayHeld: 0, todayPresent: 0 })))}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="mt-5">
          <Meter
            held={p.todayTotals.held}
            present={p.todayTotals.present}
            total={p.lecturesPerDay}
            erpHeld={p.erpTotals.held}
            erpPresent={p.erpTotals.present}
          />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
            <Legend className="bg-emerald-400" label="Present (ERP)" />
            <Legend className="bg-rose-400" label="Absent (ERP)" />
            <Legend className="bg-brand-400" label="Present (you)" />
            <Legend className="bg-amber-400" label="Absent (you)" />
            <Legend className="bg-white/[0.15]" label="Unmarked" />
          </div>
        </div>
      </section>

      {p.subjects.length === 0 ? (
        <section className="card card-pad lg:col-span-12">
          <h3 className="text-lg font-bold text-white">Today&apos;s lectures</h3>
          <p className="mt-1 text-sm text-zinc-400">Connect your ERP to mark subject by subject. Until then, set today&apos;s totals here.</p>
          <div className="mt-5 grid grid-cols-1 gap-3 xs:grid-cols-2">
            <div className="inset-panel flex items-center justify-between gap-3 p-4">
              <span className="text-sm text-zinc-300">Held</span>
              <Stepper
                value={p.todayTotals.held}
                max={12}
                onChange={(v) => p.onSetSimpleToday(v, Math.min(v, p.todayTotals.present))}
              />
            </div>
            <div className="inset-panel flex items-center justify-between gap-3 p-4">
              <span className="text-sm text-zinc-300">Attended</span>
              <Stepper
                value={p.todayTotals.present}
                max={p.todayTotals.held}
                onChange={(v) => p.onSetSimpleToday(p.todayTotals.held, v)}
              />
            </div>
          </div>
        </section>
      ) : (
        <>
          {p.erpLogs.length > 0 && (
            <section className="card card-pad lg:col-span-5">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">On the ERP</h3>
                <span className="num ml-auto text-xs text-zinc-500">
                  {p.erpTotals.present}/{p.erpTotals.held}
                </span>
              </div>
              <ul className="mt-4 divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.06]">
                {p.erpLogs.map((l, i) => (
                  <li key={`${l.code}-${i}`} className="flex items-center gap-3 bg-white/[0.015] px-3.5 py-3">
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        l.status === "P" ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"
                      )}
                    >
                      {l.status === "P" ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">{l.name}</p>
                      <p className="font-mono text-2xs text-zinc-500">
                        {l.code} · {l.held} period{l.held > 1 ? "s" : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={cn("card card-pad", p.erpLogs.length > 0 ? "lg:col-span-7" : "lg:col-span-12")}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Mark periods</h3>
                <p className="mt-0.5 text-sm text-zinc-400">
                  {slotsLeft > 0 ? `${slotsLeft} of ${p.lecturesPerDay} slots left today` : "All periods for today are marked"}
                </p>
              </div>
              <Segmented
                size="sm"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "All" },
                  { value: "lectures", label: "Lectures" },
                  { value: "labs", label: "Labs" },
                ]}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              <AnimatePresence initial={false}>
                {visible.map((s) => {
                  const h = s.todayHeld || 0;
                  const pr = s.todayPresent || 0;
                  return (
                    <motion.div
                      layout
                      key={s.code}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className={cn(
                        "rounded-2xl border p-3.5 transition-colors",
                        h > 0 ? "border-brand-400/30 bg-brand-500/[0.06]" : "border-white/[0.06] bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{s.name}</p>
                          <p className="mt-0.5 font-mono text-2xs text-zinc-500">
                            {s.code}
                            {isLab(s) ? " · Lab" : ""}
                          </p>
                        </div>
                        {h > 0 && (
                          <span className="num shrink-0 rounded-lg bg-brand-500/15 px-2 py-0.5 text-xs font-semibold text-brand-300">
                            {pr}/{h}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={slotsLeft <= 0}
                          onClick={() => mark(s.code, 1, 1)}
                          className="btn btn-sm flex-1 border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15"
                        >
                          <Plus className="h-3.5 w-3.5" /> Present
                        </button>
                        <button
                          type="button"
                          disabled={slotsLeft <= 0}
                          onClick={() => mark(s.code, 1, 0)}
                          className="btn btn-sm flex-1 border border-rose-400/20 bg-rose-400/10 text-rose-300 hover:bg-rose-400/15"
                        >
                          <Plus className="h-3.5 w-3.5" /> Absent
                        </button>
                        {h > 0 && (
                          <button
                            type="button"
                            onClick={() => mark(s.code, -1, h > pr ? 0 : -1)}
                            className="icon-btn h-8 w-8 rounded-lg"
                            aria-label={`Undo last mark for ${s.name}`}
                            title="Undo last"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {erpCodes.size > 0 && (
              <button type="button" onClick={() => setShowMarked((v) => !v)} className="btn btn-ghost btn-sm mt-3 w-full">
                {showMarked ? "Hide subjects already on the ERP" : "Show subjects already on the ERP"}
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", className)} />
      {label}
    </span>
  );
}
