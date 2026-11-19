"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck2, CircleAlert, Link2, Route, TriangleAlert } from "lucide-react";
import { ProgressRing, Meter } from "@/components/ui/Controls";
import { TargetPicker } from "./TargetPicker";
import { describeDays, formatPct } from "@/lib/attendanceEngine";
import { diffDays, longDate, shortDate } from "@/lib/dates";
import { AttendanceMetrics, Horizon, SubjectRecord } from "@/lib/types";
import { Tab } from "@/components/shell/Dock";
import { cn } from "@/lib/cn";

interface Props {
  metrics: AttendanceMetrics;
  horizon: Horizon;
  today: string;
  lecturesPerDay: number;
  isWorkingDay: boolean;
  todayTotals: { held: number; present: number };
  erpToday: { held: number; present: number };
  subjects: SubjectRecord[];
  erpConnected: boolean;
  onTarget: (v: number) => void;
  onConnect: () => void;
  go: (t: Tab) => void;
}

const fade = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: 0.04 * i, ease: [0.16, 1, 0.3, 1] as const },
});

export function OverviewView(p: Props) {
  const { metrics: m, horizon: h } = p;
  const tone = m.statusTier;
  const T = m.targetPercentage;
  const statusChip =
    tone === "safe" ? (
      <span className="chip chip-safe"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Above {T}%</span>
    ) : tone === "caution" ? (
      <span className="chip chip-warn"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Close to {T}%</span>
    ) : (
      <span className="chip chip-danger"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> Below {T}%</span>
    );

  const daysToCutoff = diffDays(p.today, h.cutoffDate);
  const skipDaysText = describeDays(m.safeBunks, p.lecturesPerDay);
  const todayUnmarked = p.isWorkingDay ? Math.max(0, p.lecturesPerDay - p.todayTotals.held) : 0;

  const atRisk = [...p.subjects].sort((a, b) => a.pct - b.pct).slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
      {!p.erpConnected && p.subjects.length === 0 && (
        <motion.div {...fade(0)} className="lg:col-span-12">
          <div className="card flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-300">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Connect your college ERP</h3>
                <p className="mt-0.5 text-sm text-zinc-400">Pull subject-wise and date-wise records automatically instead of typing numbers.</p>
              </div>
            </div>
            <button type="button" onClick={p.onConnect} className="btn btn-primary shrink-0">
              Connect <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Hero */}
      <motion.section {...fade(1)} className="card card-pad lg:col-span-7">
        <div className="flex flex-wrap items-center gap-2">
          {statusChip}
          <TargetPicker value={T} onChange={p.onTarget} />
        </div>

        <div className="mt-6 flex flex-col items-center gap-6 xs:flex-row xs:items-center sm:gap-8">
          <ProgressRing value={m.percentage} target={T} tone={tone} size={196} stroke={14}>
            <span className="eyebrow">Overall</span>
            <span className="num mt-1 font-display text-[2.6rem] font-extrabold leading-none tracking-[-0.04em] text-white">
              {m.percentage.toFixed(2)}
              <span className="text-2xl text-zinc-400">%</span>
            </span>
            <span className="num mt-1.5 text-xs text-zinc-500">
              {m.totalPresent} / {m.totalHeld}
            </span>
          </ProgressRing>

          <div className="w-full flex-1 text-center xs:text-left">
            {m.isAboveTarget ? (
              <>
                <p className="text-sm text-zinc-400">You can skip</p>
                <p className="num mt-1 font-display text-6xl font-extrabold leading-none tracking-[-0.04em] text-emerald-400">
                  {m.safeBunks}
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  lecture{m.safeBunks === 1 ? "" : "s"} and stay at {T}%
                </p>
                {skipDaysText && <p className="mt-1 text-xs text-zinc-500">{skipDaysText} of lectures</p>}
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-400">Attend the next</p>
                <p className="num mt-1 font-display text-6xl font-extrabold leading-none tracking-[-0.04em] text-rose-400">
                  {Number.isFinite(m.classesNeeded) ? m.classesNeeded : "—"}
                </p>
                <p className="mt-2 text-sm text-zinc-300">lectures in a row to reach {T}%</p>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-5">
          <MiniStat label="Attended" value={m.totalPresent} />
          <MiniStat label="Held" value={m.totalHeld} />
          <MiniStat label="Missed" value={m.totalHeld - m.totalPresent} />
        </div>
      </motion.section>

      {/* Cutoff */}
      <motion.section {...fade(2)} className="card card-pad flex flex-col lg:col-span-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">{h.cutoffLabel} cutoff</p>
            <h3 className="mt-1 text-2xl font-bold text-white">{shortDate(h.cutoffDate)}</h3>
          </div>
          {!h.passed && (
            <span className="chip chip-brand num">
              {daysToCutoff} day{daysToCutoff === 1 ? "" : "s"} away
            </span>
          )}
        </div>

        {h.passed ? (
          <div className="inset-panel mt-5 flex items-start gap-3 p-4 text-sm text-zinc-400">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
            The {h.cutoffLabel} cutoff ({longDate(h.cutoffDate)}) has passed. Set the next cutoff in Settings to keep planning.
          </div>
        ) : (
          <>
            <dl className="mt-5 grid grid-cols-2 gap-2.5">
              <Fact label="Lectures left" value={m.lecturesLeft} hint={`${m.workingDaysLeft} working day${m.workingDaysLeft === 1 ? "" : "s"}`} />
              <Fact label="Must attend" value={m.minToAttend} hint={`to end at ≥ ${T}%`} tone={m.canReachTarget ? undefined : "danger"} />
              <Fact label="Can still skip" value={m.maxSkipsBeforeCutoff} hint="before the cutoff" tone="safe" />
              <Fact label="Attend all" value={formatPct(m.projectedIfAllAttended)} hint="projected" />
            </dl>
            {!m.canReachTarget && (
              <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] p-3.5 text-sm text-rose-200">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                Even attending every lecture ends at {formatPct(m.projectedIfAllAttended)} by the cutoff.
              </div>
            )}
            <div className="mt-auto pt-5">
              <button type="button" onClick={() => p.go("planner")} className="btn btn-subtle w-full">
                <Route className="h-4 w-4" /> Plan the days ahead
              </button>
            </div>
          </>
        )}
      </motion.section>

      {/* Today */}
      <motion.section {...fade(3)} className={cn("card card-pad", atRisk.length > 0 ? "lg:col-span-5" : "lg:col-span-12")}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Today</p>
            <h3 className="mt-1 text-xl font-bold text-white">{longDate(p.today)}</h3>
          </div>
          <span className="num rounded-xl bg-white/[0.05] px-2.5 py-1 text-sm font-semibold text-white">
            {p.todayTotals.held}/{p.lecturesPerDay}
          </span>
        </div>
        <div className="mt-5">
          <Meter
            held={p.todayTotals.held}
            present={p.todayTotals.present}
            total={p.lecturesPerDay}
            erpHeld={p.erpToday.held}
            erpPresent={p.erpToday.present}
          />
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          {p.todayTotals.held === 0
            ? "Nothing marked yet."
            : `${p.todayTotals.present} attended · ${p.todayTotals.held - p.todayTotals.present} missed`}
          {todayUnmarked > 0 && p.todayTotals.held > 0 && (
            <span className="font-medium text-amber-300"> · {todayUnmarked} unmarked</span>
          )}
        </p>
        {p.erpToday.held > 0 && (
          <p className="num mt-1 text-xs text-zinc-500">
            {p.erpToday.held} of {p.lecturesPerDay} on the ERP so far
          </p>
        )}
        <button type="button" onClick={() => p.go("today")} className="btn btn-subtle mt-5 w-full">
          <CalendarCheck2 className="h-4 w-4" /> Mark today&apos;s periods
        </button>
      </motion.section>

      {/* Subjects */}
      {atRisk.length > 0 && (
        <motion.section {...fade(4)} className="card card-pad lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Subjects</p>
              <h3 className="mt-1 text-xl font-bold text-white">Lowest first</h3>
            </div>
            <button type="button" onClick={() => p.go("subjects")} className="btn btn-ghost btn-sm">
              All {p.subjects.length} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="mt-4 space-y-3.5">
            {atRisk.map((s) => {
              const ok = s.pct >= T;
              return (
                <li key={s.code}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium text-zinc-200">{s.name}</span>
                    <span className={cn("num shrink-0 text-sm font-semibold", ok ? "text-emerald-400" : "text-rose-400")}>
                      {s.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className={cn("h-full rounded-full", ok ? "bg-emerald-400/90" : "bg-rose-400/90")}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, s.pct)}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    />
                    <span className="absolute top-0 h-full w-px bg-white/50" style={{ left: `${T}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <p className="num font-display text-xl font-bold text-white sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function Fact({ label, value, hint, tone }: { label: string; value: number | string; hint?: string; tone?: "safe" | "danger" }) {
  return (
    <div className="inset-panel p-3.5">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd
        className={cn(
          "num mt-1 font-display text-2xl font-bold leading-none",
          tone === "safe" ? "text-emerald-400" : tone === "danger" ? "text-rose-400" : "text-white"
        )}
      >
        {value}
      </dd>
      {hint && <p className="mt-1.5 text-2xs text-zinc-500">{hint}</p>}
    </div>
  );
}
