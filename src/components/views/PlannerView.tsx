"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarOff, CircleCheck, CircleAlert, RotateCcw, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Segmented, Stepper } from "@/components/ui/Controls";
import { formatPct, pct, projectPlan } from "@/lib/attendanceEngine";
import { relativeDayLabel, shortDate } from "@/lib/dates";
import { inferTimetable } from "@/lib/schedule";
import { AttendanceMetrics, DatewiseMap, Horizon, PlanMap } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  metrics: AttendanceMetrics;
  horizon: Horizon;
  plan: PlanMap;
  onPlanChange: (p: PlanMap) => void;
  today: string;
  datewise: DatewiseMap;
  lecturesPerDay: number;
}

export function PlannerView(p: Props) {
  const { metrics: m, horizon: h } = p;
  const T = m.targetPercentage;
  const proj = useMemo(() => projectPlan(m, h, p.plan), [m, h, p.plan]);

  const setDay = (date: string, patch: Partial<{ attend: number; off: boolean }>, lectures: number) => {
    const cur = p.plan[date] ?? { attend: lectures };
    p.onPlanChange({ ...p.plan, [date]: { ...cur, ...patch } });
  };

  const planned = Object.keys(p.plan).some((d) => h.days.some((x) => x.date === d));

  if (h.passed || h.days.length === 0) {
    return (
      <div className="card card-pad text-center">
        <CircleAlert className="mx-auto h-8 w-8 text-zinc-500" />
        <h2 className="mt-3 text-2xl font-bold text-white">Nothing left to plan</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-zinc-400">
          {h.passed
            ? `The ${h.cutoffLabel} cutoff (${shortDate(h.cutoffDate)}) has passed. Set the next cutoff in Settings.`
            : `No working days remain before ${h.cutoffLabel} on ${shortDate(h.cutoffDate)}.`}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
      {/* Projection */}
      <section className="card card-pad overflow-hidden lg:col-span-12">
        <div
          className={cn(
            "pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl",
            proj.isEligible ? "bg-emerald-500/15" : "bg-rose-500/15"
          )}
        />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">At the {h.cutoffLabel} cutoff · {shortDate(h.cutoffDate)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="num font-display text-5xl font-extrabold tracking-[-0.04em] text-white sm:text-6xl">
                {proj.finalPct.toFixed(2)}
                <span className="text-3xl text-zinc-500">%</span>
              </span>
              {proj.isEligible ? (
                <span className="chip chip-safe"><CircleCheck className="h-3.5 w-3.5" /> Stays ≥ {T}%</span>
              ) : (
                <span className="chip chip-danger"><CircleAlert className="h-3.5 w-3.5" /> Falls below {T}%</span>
              )}
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              Attending <span className="num font-semibold text-white">{proj.attended}</span> of{" "}
              <span className="num font-semibold text-white">{proj.held}</span> lectures over {h.days.length - proj.offDays} day
              {h.days.length - proj.offDays === 1 ? "" : "s"}
              {proj.skipped > 0 && (
                <>
                  {" "}· skipping <span className="num font-semibold text-amber-300">{proj.skipped}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip chip-neutral num">Skip budget {m.maxSkipsBeforeCutoff}</span>
            {planned && (
              <button type="button" onClick={() => p.onPlanChange({})} className="btn btn-subtle btn-sm">
                <RotateCcw className="h-3.5 w-3.5" /> Reset plan
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Day plan */}
      <section className="card card-pad lg:col-span-7">
        <h3 className="text-lg font-bold text-white">Day by day</h3>
        <p className="mt-0.5 text-sm text-zinc-400">
          {h.lecturesLeft} lectures across {h.workingDaysLeft} working day{h.workingDaysLeft === 1 ? "" : "s"}, weekends and holidays excluded.
        </p>
        <ul className="mt-4 space-y-2.5">
          {h.days.map((d) => {
            const entry = p.plan[d.date];
            const attend = Math.min(d.lectures, entry?.attend ?? d.lectures);
            const off = !!entry?.off;
            const expected = d.isToday ? [] : inferTimetable(p.datewise, d.date, p.today);
            const names = Array.from(new Set(expected.map((e) => e.name)));
            return (
              <li
                key={d.date}
                className={cn(
                  "rounded-2xl border p-3.5 transition-colors sm:p-4",
                  off
                    ? "border-white/[0.04] bg-white/[0.01]"
                    : attend < d.lectures
                    ? "border-amber-400/20 bg-amber-400/[0.04]"
                    : "border-white/[0.06] bg-white/[0.02]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold", off ? "text-zinc-500 line-through" : "text-white")}>
                      {d.isToday ? "Rest of today" : relativeDayLabel(d.date, p.today)}
                      {(d.isToday || relativeDayLabel(d.date, p.today) === "Tomorrow") && (
                        <span className="ml-2 whitespace-nowrap text-xs font-normal text-zinc-500">{d.isToday ? `${d.lectures} left` : shortDate(d.date)}</span>
                      )}
                    </p>
                    {names.length > 0 && !off && (
                      <p className="mt-0.5 truncate text-xs text-zinc-500" title={names.join(", ")}>
                        {names.join(" · ")}
                      </p>
                    )}
                  </div>
                  {off ? (
                    <button type="button" onClick={() => setDay(d.date, { off: false }, d.lectures)} className="btn btn-ghost btn-sm shrink-0">
                      <Undo2 className="h-3.5 w-3.5" /> No classes · undo
                    </button>
                  ) : (
                    <div className="shrink-0">
                      <Stepper
                        size="sm"
                        value={attend}
                        max={d.lectures}
                        onChange={(v) => setDay(d.date, { attend: v }, d.lectures)}
                        label={
                          <>
                            {attend}
                            <span className="text-zinc-500">/{d.lectures}</span>
                          </>
                        }
                      />
                    </div>
                  )}
                </div>
                {!off && (
                      <div className="mt-2.5 flex justify-end gap-1">
                        <QuickBtn active={attend === d.lectures} onClick={() => setDay(d.date, { attend: d.lectures }, d.lectures)}>
                          All
                        </QuickBtn>
                        <QuickBtn active={attend === Math.floor(d.lectures / 2)} onClick={() => setDay(d.date, { attend: Math.floor(d.lectures / 2) }, d.lectures)}>
                          Half
                        </QuickBtn>
                        <QuickBtn active={attend === 0} onClick={() => setDay(d.date, { attend: 0 }, d.lectures)}>
                          Skip
                        </QuickBtn>
                        <button
                          type="button"
                          title="College closed this day"
                          aria-label="Mark as no classes"
                          onClick={() => setDay(d.date, { off: true }, d.lectures)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200"
                        >
                          <CalendarOff className="h-3.5 w-3.5" />
                        </button>
                      </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <WhatIf metrics={m} lecturesPerDay={p.lecturesPerDay} />
        </div>
      </div>
    </div>
  );
}

function QuickBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 rounded-lg px-2.5 text-xs font-medium transition",
        active ? "bg-white text-ink-950" : "bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1]"
      )}
    >
      {children}
    </button>
  );
}

function WhatIf({ metrics: m, lecturesPerDay }: { metrics: AttendanceMetrics; lecturesPerDay: number }) {
  const [mode, setMode] = useState<"skip" | "attend">(m.isAboveTarget ? "skip" : "attend");
  const [n, setN] = useState(0);
  const T = m.targetPercentage;

  const max = mode === "skip" ? Math.max(lecturesPerDay * 4, m.safeBunks + lecturesPerDay) : Math.max(lecturesPerDay * 5, (Number.isFinite(m.classesNeeded) ? m.classesNeeded : 0) + lecturesPerDay * 2);
  const value = Math.min(n, max);
  const resPct = mode === "skip" ? pct(m.totalPresent, m.totalHeld + value) : pct(m.totalPresent + value, m.totalHeld + value);
  const ok = resPct >= T;
  const fill = (value / max) * 100;

  const scenarios = useMemo(() => {
    const set = new Set<number>([Math.floor(lecturesPerDay / 2), lecturesPerDay, lecturesPerDay * 2]);
    if (m.safeBunks > 0) {
      set.add(m.safeBunks);
      set.add(m.safeBunks + 1);
    }
    return Array.from(set)
      .filter((x) => x > 0)
      .sort((a, b) => a - b)
      .map((x) => ({ n: x, pct: pct(m.totalPresent, m.totalHeld + x) }));
  }, [m, lecturesPerDay]);

  return (
    <section className="card card-pad">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">What if</h3>
        <Segmented
          size="sm"
          value={mode}
          onChange={(v) => {
            setMode(v);
            setN(0);
          }}
          options={[
            { value: "skip", label: "I skip" },
            { value: "attend", label: "I attend" },
          ]}
        />
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">
            {mode === "skip" ? "Skip the next" : "Attend the next"}
          </p>
          <p className="num font-display text-4xl font-extrabold text-white">
            {value} <span className="text-base font-semibold text-zinc-500">lecture{value === 1 ? "" : "s"}</span>
          </p>
        </div>
        <div className="text-right">
          <p className={cn("num font-display text-3xl font-extrabold", ok ? "text-emerald-400" : "text-rose-400")}>{formatPct(resPct)}</p>
          <p className="text-xs text-zinc-500">{ok ? `at or above ${T}%` : `below ${T}%`}</p>
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => setN(Number(e.target.value))}
        className="range mt-5"
        style={{
          background: `linear-gradient(to right, ${mode === "skip" ? "#f59e0b" : "#2f8cff"} ${fill}%, rgba(255,255,255,0.08) ${fill}%)`,
        }}
        aria-label="Number of lectures"
      />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {mode === "skip" ? (
          <>
            <QuickBtn active={value === lecturesPerDay} onClick={() => setN(lecturesPerDay)}>1 day</QuickBtn>
            <QuickBtn active={value === lecturesPerDay * 2} onClick={() => setN(lecturesPerDay * 2)}>2 days</QuickBtn>
            {m.safeBunks > 0 && (
              <QuickBtn active={value === m.safeBunks} onClick={() => setN(m.safeBunks)}>Max safe · {m.safeBunks}</QuickBtn>
            )}
          </>
        ) : (
          <>
            <QuickBtn active={value === lecturesPerDay} onClick={() => setN(lecturesPerDay)}>1 day</QuickBtn>
            {!m.isAboveTarget && Number.isFinite(m.classesNeeded) && (
              <QuickBtn active={value === m.classesNeeded} onClick={() => setN(m.classesNeeded)}>Reach {T}% · {m.classesNeeded}</QuickBtn>
            )}
          </>
        )}
      </div>

      <AnimatePresence initial={false}>
        {mode === "skip" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <p className="eyebrow mb-2 mt-6">If you skip right now</p>
            <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.06]">
              {scenarios.map((s) => {
                const good = s.pct >= T;
                return (
                  <li key={s.n}>
                    <button
                      type="button"
                      onClick={() => setN(s.n)}
                      className={cn("flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition hover:bg-white/[0.03]", value === s.n && "bg-white/[0.05]")}
                    >
                      <span className="text-zinc-300">
                        <span className="num font-semibold text-white">{s.n}</span> lecture{s.n === 1 ? "" : "s"}
                        {s.n === m.safeBunks && <span className="ml-2 text-xs text-emerald-400">last safe</span>}
                        {s.n === m.safeBunks + 1 && m.safeBunks > 0 && <span className="ml-2 text-xs text-rose-400">first below</span>}
                      </span>
                      <span className={cn("num font-semibold", good ? "text-emerald-400" : "text-rose-400")}>{formatPct(s.pct)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
