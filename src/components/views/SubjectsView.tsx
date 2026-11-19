"use client";

import { motion } from "framer-motion";
import { BookOpen, FlaskConical, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/Controls";
import { isLabSubject, lecturesNeeded, safeSkips } from "@/lib/attendanceEngine";
import { SubjectRecord } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  subjects: SubjectRecord[];
  targetPercentage: number;
  onUpdateSubjects: (s: SubjectRecord[]) => void;
  onConnect: () => void;
}

const isLab = (s: SubjectRecord) => (s.isLab !== undefined ? s.isLab : isLabSubject(s.code, s.name));

export function SubjectsView({ subjects, targetPercentage: T, onUpdateSubjects, onConnect }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "lectures" | "labs" | "below">("all");
  const [sort, setSort] = useState<"low" | "name">("low");

  const below = subjects.filter((s) => s.pct < T).length;

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return subjects
      .filter((s) => !query || s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query))
      .filter((s) => (filter === "labs" ? isLab(s) : filter === "lectures" ? !isLab(s) : filter === "below" ? s.pct < T : true))
      .sort((a, b) => (sort === "low" ? a.pct - b.pct : a.name.localeCompare(b.name)));
  }, [subjects, q, filter, sort, T]);

  if (subjects.length === 0) {
    return (
      <div className="card card-pad flex flex-col items-center py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-zinc-400">
          <BookOpen className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-white">No subjects yet</h2>
        <p className="mt-1.5 max-w-sm text-sm text-zinc-400">Connect your college ERP to load each subject&apos;s attendance.</p>
        <button type="button" onClick={onConnect} className="btn btn-primary mt-6">
          Connect ERP
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="card card-pad">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Subjects</p>
            <h2 className="mt-1 text-3xl font-extrabold text-white">
              {subjects.length} courses
              {below > 0 && <span className="ml-3 align-middle text-sm font-medium text-rose-400">{below} below {T}%</span>}
            </h2>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or code"
              className="field pl-10"
              aria-label="Search subjects"
            />
          </div>
        </div>
        <div className="no-scrollbar -mx-1 mt-4 flex items-center gap-2 overflow-x-auto px-1">
          <Segmented
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All" },
              { value: "lectures", label: "Lectures" },
              { value: "labs", label: "Labs" },
              { value: "below", label: `Below ${T}%` },
            ]}
          />
          <Segmented
            size="sm"
            value={sort}
            onChange={setSort}
            options={[
              { value: "low", label: "Lowest" },
              { value: "name", label: "A–Z" },
            ]}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((s, i) => {
          const ok = s.pct >= T;
          const skips = ok ? safeSkips(s.pres, s.held, T) : 0;
          const need = ok ? 0 : lecturesNeeded(s.pres, s.held, T);
          const lab = isLab(s);
          return (
            <motion.article
              key={s.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i, 10) * 0.025 }}
              className="card p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-sans text-[0.95rem] font-semibold leading-snug tracking-normal text-white">{s.name}</h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-mono">{s.code}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateSubjects(subjects.map((x) => (x.code === s.code ? { ...x, isLab: !lab } : x)))}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition",
                        lab ? "bg-violet-400/10 text-violet-300 hover:bg-violet-400/20" : "bg-white/[0.05] text-zinc-400 hover:bg-white/[0.1]"
                      )}
                      title="Tap to switch between lab and lecture"
                    >
                      {lab ? <FlaskConical className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
                      {lab ? "Lab" : "Lecture"}
                    </button>
                  </div>
                </div>
                <span className={cn("num shrink-0 font-display text-2xl font-extrabold", ok ? "text-emerald-400" : "text-rose-400")}>
                  {s.pct.toFixed(1)}
                  <span className="text-sm text-zinc-500">%</span>
                </span>
              </div>

              <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className={cn("h-full rounded-full", ok ? "bg-emerald-400/90" : "bg-rose-400/90")} style={{ width: `${Math.min(100, s.pct)}%` }} />
                <span className="absolute top-0 h-full w-px bg-white/50" style={{ left: `${T}%` }} />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="num text-zinc-400">
                  {s.pres}/{s.held} attended
                </span>
                {ok ? (
                  <span className="num font-medium text-emerald-300">can skip {skips}</span>
                ) : (
                  <span className="num font-medium text-rose-300">attend {Number.isFinite(need) ? need : "—"} more</span>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
      {list.length === 0 && <p className="py-10 text-center text-sm text-zinc-500">No subjects match.</p>}
    </div>
  );
}
