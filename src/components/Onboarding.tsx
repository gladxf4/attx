"use client";

import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, CalendarCheck2, RefreshCw, Route } from "lucide-react";
import { useState } from "react";
import { Brand, Credits } from "@/components/ui/Brand";
import { Segmented, Stepper } from "@/components/ui/Controls";
import { AuthForm, AuthResult } from "@/components/sheets/AuthForm";
import { clampInt, officialPresentFrom } from "@/lib/attendanceEngine";
import { longDate } from "@/lib/dates";
import { AttendanceInput } from "@/lib/types";

interface Props {
  today: string;
  lecturesPerDay: number;
  onGuest: (a: AttendanceInput) => void;
  onAuth: (r: AuthResult, mode: "login" | "register") => void;
  onConnectErp: () => void;
  onFeedback: () => void;
}

const FEATURES = [
  { icon: RefreshCw, title: "Synced with your ERP", body: "Subject-wise and date-wise records pulled in one tap." },
  { icon: CalendarCheck2, title: "Today, as it happens", body: "Mark periods before the ERP catches up." },
  { icon: Route, title: "Planned to the cutoff", body: "See what every skip does to your final percentage." },
];

export function Onboarding({ today, lecturesPerDay, onGuest, onAuth, onConnectErp, onFeedback }: Props) {
  const [tab, setTab] = useState<"guest" | "account">("guest");
  const [held, setHeld] = useState("");
  const [attended, setAttended] = useState("");
  const [overall, setOverall] = useState("");
  const [tHeld, setTHeld] = useState(0);
  const [tPres, setTPres] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const submitGuest = (e: React.FormEvent) => {
    e.preventDefault();
    const h = clampInt(held, 0, 5000, 0);
    const a = clampInt(attended, 0, 5000, -1);
    const o = overall.trim() ? Number(overall) : undefined;
    if (h <= 0) return setError("Enter how many lectures have been held.");
    if (a < 0 || a > h) return setError("Attended has to be between 0 and lectures held.");
    if (o !== undefined && (!Number.isFinite(o) || o < 0 || o > 100)) return setError("Overall % must be between 0 and 100.");
    onGuest({
      baselineHeld: h,
      baselinePresent: officialPresentFrom(h, a, o),
      todayHeld: tHeld,
      todayPresent: tPres,
      targetPercentage: 75,
    });
  };

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="app-backdrop" />
      <div className="pointer-events-none absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-brand-500/20 blur-[120px] lg:left-[28%]" />

      <div className="mx-auto grid min-h-dvh max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-10 pt-[calc(2.5rem+var(--safe-t))] sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Brand size="xl" />
          <h1 className="mt-8 max-w-lg text-[2.1rem] font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-[3.4rem]">
            Know exactly how many lectures you can skip.
          </h1>
          <ul className="mt-8 hidden space-y-5 lg:block">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-brand-300">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-sm text-zinc-400">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <Credits className="mt-12 hidden lg:flex lg:justify-start" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }} className="mx-auto w-full max-w-md">
          <div className="card p-5 sm:p-7">
            <Segmented
              full
              value={tab}
              onChange={(t) => {
                setTab(t);
                setError(null);
              }}
              options={[
                { value: "guest", label: "Quick start" },
                { value: "account", label: "Account" },
              ]}
            />

            <div className="mt-6">
              {tab === "guest" ? (
                <form onSubmit={submitGuest} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Your numbers from the ERP</h2>
                    <p className="mt-1 text-sm text-zinc-400">Totals up to yesterday. Nothing leaves this device.</p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200" role="alert">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label" htmlFor="g-held">Lectures held</label>
                      <input id="g-held" className="field num" inputMode="numeric" required value={held} onChange={(e) => setHeld(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="g-att">Attended</label>
                      <input id="g-att" className="field num" inputMode="numeric" required value={attended} onChange={(e) => setAttended(e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="g-pct">
                      Overall % shown on the ERP <span className="text-zinc-600">· optional</span>
                    </label>
                    <input id="g-pct" className="field num" inputMode="decimal" value={overall} onChange={(e) => setOverall(e.target.value)} placeholder="e.g. 81.25" />
                  </div>

                  <div className="inset-panel space-y-3 p-4">
                    <p className="text-sm font-medium text-zinc-200">Today · {longDate(today)}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-400">Held so far</span>
                      <Stepper
                        size="sm"
                        value={tHeld}
                        max={lecturesPerDay}
                        onChange={(v) => {
                          setTHeld(v);
                          setTPres((p) => Math.min(p, v));
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-400">Attended</span>
                      <Stepper size="sm" value={tPres} max={tHeld} onChange={setTPres} />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-light btn-lg w-full">
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-3 text-xs text-zinc-600">
                    <span className="h-px flex-1 bg-white/[0.06]" /> or <span className="h-px flex-1 bg-white/[0.06]" />
                  </div>
                  <button type="button" onClick={onConnectErp} className="btn btn-subtle btn-lg w-full">
                    <RefreshCw className="h-4 w-4" /> Import from college ERP
                  </button>
                </form>
              ) : (
                <AuthForm onSuccess={onAuth} />
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-col items-center gap-3 lg:hidden">
            <Credits />
          </div>
          <button type="button" onClick={onFeedback} className="mx-auto mt-3 block text-xs text-zinc-500 transition hover:text-zinc-300">
            Send feedback
          </button>
        </motion.div>
      </div>
    </div>
  );
}
