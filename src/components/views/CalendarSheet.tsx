"use client";

import { CalendarDays, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { AcademicCalendar } from "@/lib/academicCalendar";
import { addDays, formatISO, longDate, parseISO, toISO, weekday } from "@/lib/dates";
import { buildDay, DayInfo } from "@/lib/schedule";
import { DatewiseMap, PlanMap, SubjectRecord } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  today: string;
  cal: AcademicCalendar;
  datewise: DatewiseMap;
  subjects: SubjectRecord[];
  plan: PlanMap;
  todayTotals: { held: number; present: number };
  targetPercentage: number;
  onOpenPlanner: () => void;
  onOpenToday: () => void;
}

const monthKey = (iso: string) => iso.slice(0, 7);
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function shiftMonth(key: string, delta: number) {
  const d = parseISO(`${key}-01`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return toISO(d).slice(0, 7);
}

export function CalendarSheet(p: Props) {
  const [month, setMonth] = useState(monthKey(p.today));
  const [selected, setSelected] = useState(p.today);

  useEffect(() => {
    if (p.open) {
      setMonth(monthKey(p.today));
      setSelected(p.today);
    }
  }, [p.open, p.today]);

  const range = useMemo(() => {
    const dates = Object.keys(p.datewise).sort();
    const first = dates[0] ? monthKey(dates[0]) : monthKey(p.today);
    const lastCandidate = [monthKey(p.cal.cutoffDate), monthKey(p.today)].sort().pop()!;
    return { first: first < monthKey(p.today) ? first : monthKey(p.today), last: lastCandidate };
  }, [p.datewise, p.today, p.cal.cutoffDate]);

  const ctx = { today: p.today, cal: p.cal, datewise: p.datewise, subjects: p.subjects, plan: p.plan, todayTotals: p.todayTotals };

  const cells = useMemo(() => {
    const first = `${month}-01`;
    const lead = (weekday(first) + 6) % 7; // Monday-first
    const start = addDays(first, -lead);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i)).filter(
      (d, i) => i < 35 || monthKey(addDays(start, 35)) === month
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const days = useMemo(() => cells.map((d) => buildDay(d, ctx)), [cells, p.datewise, p.subjects, p.plan, p.todayTotals, p.cal, p.today]); // eslint-disable-line react-hooks/exhaustive-deps
  const sel = useMemo(() => buildDay(selected, ctx), [selected, p.datewise, p.subjects, p.plan, p.todayTotals, p.cal, p.today]); // eslint-disable-line react-hooks/exhaustive-deps

  const monthStats = days
    .filter((d) => monthKey(d.date) === month && d.kind !== "future")
    .reduce((a, d) => ({ held: a.held + d.held, present: a.present + d.present }), { held: 0, present: 0 });

  return (
    <Sheet open={p.open} onClose={p.onClose} size="xl" title="Calendar" icon={<CalendarDays className="h-5 w-5" />}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">{formatISO(`${month}-01`, { month: "long", year: "numeric" })}</h3>
              {monthStats.held > 0 && (
                <p className="num text-xs text-zinc-500">
                  {monthStats.present}/{monthStats.held} attended this month
                </p>
              )}
            </div>
            <div className="flex gap-1.5">
              <button type="button" className="icon-btn h-9 w-9" aria-label="Previous month" disabled={month <= range.first} onClick={() => setMonth(shiftMonth(month, -1))}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" className="icon-btn h-9 w-9" aria-label="Next month" disabled={month >= range.last} onClick={() => setMonth(shiftMonth(month, 1))}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-2xs font-medium uppercase tracking-wider text-zinc-500">
            {WEEK.map((w) => (
              <div key={w} className="py-1.5">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => (
              <DayCell
                key={d.date}
                d={d}
                inMonth={monthKey(d.date) === month}
                selected={d.date === selected}
                target={p.targetPercentage}
                onClick={() => setSelected(d.date)}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-500">
            <Key className="bg-emerald-400" label="Attended well" />
            <Key className="bg-rose-400" label="Below target" />
            <Key className="bg-brand-400" label="Planned" />
            <Key className="bg-amber-400" label="Holiday" />
            <Key className="bg-violet-400" label="Cutoff" />
          </div>
        </div>

        <DayDetail d={sel} onOpenPlanner={p.onOpenPlanner} onOpenToday={p.onOpenToday} />
      </div>
    </Sheet>
  );
}

function DayCell({ d, inMonth, selected, target, onClick }: { d: DayInfo; inMonth: boolean; selected: boolean; target: number; onClick: () => void }) {
  const ratio = d.held > 0 ? (d.present / d.held) * 100 : null;
  let dot: string | null = null;
  if (d.isCutoff) dot = "bg-violet-400";
  else if (d.closedReason && d.closedReason !== "Weekend") dot = "bg-amber-400";
  else if (ratio !== null) dot = ratio >= target ? "bg-emerald-400" : "bg-rose-400";
  else if (d.plan && !d.plan.off) dot = d.plan.attend < d.plan.lectures ? "bg-amber-300" : "bg-brand-400";

  const weekend = d.closedReason === "Weekend";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition sm:aspect-[1.15]",
        !inMonth && "opacity-30",
        weekend || d.afterCutoff ? "text-zinc-600" : "text-zinc-200",
        d.kind === "today" && "font-bold text-white ring-1 ring-inset ring-brand-400/60",
        selected ? "bg-white text-ink-950 ring-0" : "hover:bg-white/[0.06]"
      )}
    >
      <span className={cn("num", selected && "text-ink-950")}>{Number(d.date.slice(8))}</span>
      {ratio !== null && (
        <span className={cn("num hidden text-[0.6rem] leading-none sm:block", selected ? "text-ink-950/70" : "text-zinc-500")}>
          {d.present}/{d.held}
        </span>
      )}
      {dot && <span className={cn("absolute bottom-1.5 h-1 w-1 rounded-full sm:bottom-1", dot, ratio !== null && "sm:hidden")} />}
    </button>
  );
}

function DayDetail({ d, onOpenPlanner, onOpenToday }: { d: DayInfo; onOpenPlanner: () => void; onOpenToday: () => void }) {
  const subtitle = d.isCutoff
    ? d.closedReason
    : d.closedReason
    ? d.closedReason
    : d.afterCutoff
    ? "After the cutoff"
    : d.kind === "future"
    ? d.plan?.off
      ? "Planned: no classes"
      : `Planned: attend ${d.plan?.attend ?? 0} of ${d.plan?.lectures ?? 0}`
    : d.held > 0
    ? `${d.present} of ${d.held} attended`
    : d.kind === "today"
    ? "Nothing marked yet"
    : "No records on the ERP";

  return (
    <div className="inset-panel flex min-h-[18rem] flex-col p-4 sm:p-5">
      <p className="eyebrow">{d.kind === "today" ? "Today" : d.kind === "future" ? "Upcoming" : "Past"}</p>
      <h3 className="mt-1 text-xl font-bold text-white">{longDate(d.date)}</h3>
      <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>

      {d.periods.length > 0 && (
        <>
          {d.kind === "future" && <p className="eyebrow mt-5">Likely timetable</p>}
          <ul className={cn("space-y-1.5", d.kind === "future" ? "mt-2" : "mt-5")}>
            {d.periods.map((x, i) => (
              <li key={`${x.code}-${i}`} className="flex items-center gap-3 rounded-xl bg-white/[0.025] px-3 py-2.5">
                {x.source === "expected" ? (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-brand-400/70" />
                ) : x.present >= x.held ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <Check className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-400/15 text-rose-300">
                    <X className="h-3 w-3" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-zinc-100">{x.name}</p>
                  <p className="font-mono text-2xs text-zinc-500">
                    {x.code}
                    {x.held > 1 ? ` · ${x.held} periods` : ""}
                    {x.source === "manual" ? " · marked by you" : ""}
                  </p>
                </div>
                {x.source !== "expected" && x.held > 1 && (
                  <span className="num text-xs text-zinc-400">
                    {x.present}/{x.held}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-auto pt-5">
        {d.kind === "today" && (
          <button type="button" onClick={onOpenToday} className="btn btn-subtle w-full">
            Mark today&apos;s periods
          </button>
        )}
        {d.kind === "future" && d.isWorking && (
          <button type="button" onClick={onOpenPlanner} className="btn btn-subtle w-full">
            Change plan
          </button>
        )}
      </div>
    </div>
  );
}

function Key({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", className)} />
      {label}
    </span>
  );
}
