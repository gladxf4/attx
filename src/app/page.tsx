"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/shell/TopBar";
import { Dock, Tab, TABS } from "@/components/shell/Dock";
import { Brand, Credits } from "@/components/ui/Brand";
import { Sheet } from "@/components/ui/Sheet";
import { Onboarding } from "@/components/Onboarding";
import { OverviewView } from "@/components/views/OverviewView";
import { TodayView } from "@/components/views/TodayView";
import { PlannerView } from "@/components/views/PlannerView";
import { SubjectsView } from "@/components/views/SubjectsView";
import { CalendarSheet } from "@/components/views/CalendarSheet";
import { ErpSheet } from "@/components/sheets/ErpSheet";
import { SettingsSheet } from "@/components/sheets/SettingsSheet";
import { FeedbackSheet } from "@/components/sheets/FeedbackSheet";
import { AuthForm, AuthResult } from "@/components/sheets/AuthForm";
import { CalendarPrefs, holidayReason, isWorkingDay, resolveCalendar } from "@/lib/academicCalendar";
import { computeMetrics, getHorizon, officialPresentFrom } from "@/lib/attendanceEngine";
import { isoDateInCollegeTz, todayISO } from "@/lib/dates";
import { clearErpSession, ErpSyncResult, loadErpSession, refreshErp } from "@/lib/erpClient";
import { getErpDay, sumLogs } from "@/lib/schedule";
import { AttendanceInput, DatewiseMap, PlanMap, SessionUser, SubjectRecord } from "@/lib/types";

const K = {
  token: "attendx_token",
  cache: "attendx_cache_v2",
  guest: "attendx_guest_v2",
  subjects: "attendx_subjects",
  datewise: "attendx_datewise_erp",
  prefs: "attendx_prefs_v1",
  plan: "attendx_plan_v1",
};
const LEGACY = ["attendx_cached_user", "attendx_cached_metrics", "attendx_guest_data"];

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked
  }
}
function removeKeys(...keys: string[]) {
  try {
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/** Moves yesterday's "today" numbers into the baseline when the date changes. */
function rollover(att: AttendanceInput, subjects: SubjectRecord[], fromDate: string | null, today: string) {
  if (!fromDate || fromDate >= today || (att.todayHeld === 0 && !subjects.some((s) => s.todayHeld))) {
    return { att, subjects, rolled: false };
  }
  return {
    att: {
      ...att,
      baselineHeld: att.baselineHeld + att.todayHeld,
      baselinePresent: att.baselinePresent + att.todayPresent,
      todayHeld: 0,
      todayPresent: 0,
    },
    subjects: subjects.map((s) => ({ ...s, todayHeld: 0, todayPresent: 0 })),
    rolled: true,
  };
}

function migrateLegacyGuest(): AttendanceInput | null {
  const g = readJSON<any>("attendx_guest_data");
  if (!g || !(Number(g.totalHeld) > 0)) return null;
  const held = Math.round(Number(g.totalHeld));
  const attended = Math.round(Number(g.academicPresent) || 0);
  const credited = Math.min(held, attended + Math.max(0, Math.round(Number(g.concessionBuffer) || 0)));
  return {
    baselineHeld: held,
    baselinePresent: g.officialPercentage ? officialPresentFrom(held, attended, Number(g.officialPercentage)) : credited,
    todayHeld: Math.max(0, Math.round(Number(g.thursdayHeld) || 0)),
    todayPresent: Math.max(0, Math.round(Number(g.thursdayPresent) || 0)),
    targetPercentage: Number(g.targetPercentage) || 75,
  };
}

type SheetId = null | "erp" | "settings" | "feedback" | "calendar" | "auth";

export default function Home() {
  const [today, setToday] = useState<string>(() => todayISO());
  const [phase, setPhase] = useState<"loading" | "onboarding" | "app">("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [att, setAtt] = useState<AttendanceInput | null>(null);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [datewise, setDatewise] = useState<DatewiseMap>({});
  const [prefs, setPrefs] = useState<CalendarPrefs>({});
  const [plan, setPlan] = useState<PlanMap>({});
  const [tab, setTabState] = useState<Tab>("overview");
  const [syncing, setSyncing] = useState(false);
  const [erpConnected, setErpConnected] = useState(false);
  const [sheet, setSheet] = useState<SheetId>(null);
  const [notice, setNotice] = useState<{ text: string; type: "success" | "warning" } | null>(null);

  const attRef = useRef(att);
  const subjectsRef = useRef(subjects);
  const userRef = useRef(user);
  const todayRef = useRef(today);
  const datewiseRef = useRef(datewise);
  const phaseRef = useRef(phase);
  attRef.current = att;
  subjectsRef.current = subjects;
  userRef.current = user;
  todayRef.current = today;
  datewiseRef.current = datewise;
  phaseRef.current = phase;

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cal = useMemo(() => resolveCalendar(prefs), [prefs]);

  const showNotice = useCallback((text: string, type: "success" | "warning" = "success", ms = 3500) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ text, type });
    noticeTimer.current = setTimeout(() => setNotice(null), ms);
  }, []);

  const signOutLocal = useCallback(() => {
    removeKeys(...Object.values(K), ...LEGACY);
    clearErpSession();
    setUser(null);
    setAtt(null);
    setSubjects([]);
    setDatewise({});
    setPlan({});
    setErpConnected(false);
    setSheet(null);
    setPhase("onboarding");
  }, []);

  const putAttendance = useCallback(
    async (token: string, a: AttendanceInput, subs: SubjectRecord[]) => {
      try {
        const res = await fetch("/api/attendance", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...a, subjects: subs }),
        });
        if (res.status === 401) {
          removeKeys(K.token, K.cache);
          setUser(null);
          writeJSON(K.guest, { attendance: a, date: todayRef.current });
          showNotice("Your session expired. Sign in again to keep syncing.", "warning", 6000);
        }
      } catch {
        // offline: the local cache keeps the change and the next save retries
      }
    },
    [showNotice]
  );

  const commit = useCallback(
    (nextAtt: AttendanceInput, nextSubjects: SubjectRecord[] = subjectsRef.current) => {
      setAtt(nextAtt);
      setSubjects(nextSubjects);
      attRef.current = nextAtt;
      subjectsRef.current = nextSubjects;
      writeJSON(K.subjects, nextSubjects);
      let token: string | null = null;
      try {
        token = localStorage.getItem(K.token);
      } catch {}
      if (token && userRef.current) {
        writeJSON(K.cache, { user: userRef.current, attendance: nextAtt, date: todayRef.current });
        if (saveTimer.current) clearTimeout(saveTimer.current);
        const t = token;
        saveTimer.current = setTimeout(() => putAttendance(t, nextAtt, nextSubjects), 700);
      } else {
        writeJSON(K.guest, { attendance: nextAtt, date: todayRef.current });
      }
    },
    [putAttendance]
  );

  const applyErp = useCallback(
    (data: ErpSyncResult) => {
      const dw = data.datewiseAttendance && typeof data.datewiseAttendance === "object" ? data.datewiseAttendance : {};
      setDatewise(dw);
      datewiseRef.current = dw;
      writeJSON(K.datewise, dw);

      const todayLogs = getErpDay(dw, todayRef.current);
      const t = sumLogs(todayLogs);
      const onErp = new Set(todayLogs.map((l) => (l.code || "").trim()));
      const prevManual = new Map(subjectsRef.current.map((s) => [s.code, s]));
      const base = data.subjects?.length ? data.subjects : subjectsRef.current;
      // Keep periods the student marked for subjects the ERP hasn't uploaded yet.
      const subs = base.map((s) => {
        const prev = prevManual.get(s.code);
        const keep = prev && !onErp.has((s.code || "").trim());
        return { ...s, todayHeld: keep ? prev!.todayHeld || 0 : 0, todayPresent: keep ? prev!.todayPresent || 0 : 0 };
      });
      const manualHeld = subs.reduce((a, s) => a + (s.todayHeld || 0), 0);
      const manualPres = subs.reduce((a, s) => a + (s.todayPresent || 0), 0);

      const held = Math.max(0, Math.round(Number(data.totalHeld) || 0) - t.held);
      const present = Math.max(0, Math.min(held, Math.round(Number(data.officialPresent) || 0) - t.present));
      commit(
        {
          baselineHeld: held,
          baselinePresent: present,
          todayHeld: t.held + manualHeld,
          todayPresent: t.present + manualPres,
          targetPercentage: attRef.current?.targetPercentage ?? 75,
        },
        subs
      );
      setErpConnected(true);
      if (phaseRef.current !== "app") setPhase("app");
    },
    [commit]
  );

  const backgroundErpSync = useCallback(async () => {
    const session = loadErpSession();
    if (!session) return;
    setErpConnected(true);
    setSyncing(true);
    const r = await refreshErp(session);
    setSyncing(false);
    if (r.ok) {
      if (r.data.session) writeJSON("attendx_erp_v2", { token: r.data.session, erpId: r.data.erpId || session.erpId });
      removeKeys("attendx_erp_session");
      applyErp(r.data);
      showNotice("Synced with the ERP");
    } else if (r.expired) {
      clearErpSession();
      setErpConnected(false);
      showNotice("ERP session expired. Tap Connect ERP to sign in again.", "warning", 6000);
    }
  }, [applyErp, showNotice]);

  const acceptAuth = useCallback(
    (r: AuthResult) => {
      const t = todayRef.current;
      const rolled = rollover(r.attendance, r.subjects?.length ? r.subjects : subjectsRef.current, isoDateInCollegeTz(r.updatedAt), t);
      try {
        localStorage.setItem(K.token, r.token);
      } catch {}
      removeKeys(K.guest, ...LEGACY);
      setUser(r.user);
      userRef.current = r.user;
      commit(rolled.att, rolled.subjects);
      if (rolled.rolled) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        putAttendance(r.token, rolled.att, rolled.subjects);
      }
      return rolled;
    },
    [commit, putAttendance]
  );

  // Hydrate from local storage instantly, then reconcile with the server and ERP.
  useEffect(() => {
    const t = todayISO();
    setToday(t);
    todayRef.current = t;

    const dw = readJSON<DatewiseMap>(K.datewise) || {};
    setDatewise(dw);
    datewiseRef.current = dw;
    const localSubs = readJSON<SubjectRecord[]>(K.subjects) || [];
    setPrefs(readJSON<CalendarPrefs>(K.prefs) || {});
    const savedPlan = readJSON<PlanMap>(K.plan) || {};
    const prunedPlan = Object.fromEntries(Object.entries(savedPlan).filter(([d]) => d >= t));
    setPlan(prunedPlan);

    const hash = window.location.hash.replace("#", "") as Tab;
    if (TABS.some((x) => x.id === hash)) setTabState(hash);

    let token: string | null = null;
    try {
      token = localStorage.getItem(K.token);
    } catch {}

    let ready = false;
    if (token) {
      const cache = readJSON<{ user: SessionUser; attendance: AttendanceInput; date: string }>(K.cache);
      if (cache?.user && cache.attendance) {
        const r = rollover(cache.attendance, localSubs, cache.date, t);
        setUser(cache.user);
        userRef.current = cache.user;
        setAtt(r.att);
        setSubjects(r.subjects);
        attRef.current = r.att;
        subjectsRef.current = r.subjects;
        ready = true;
      }
    } else {
      const guest = readJSON<{ attendance: AttendanceInput; date: string }>(K.guest);
      const legacy = guest ? null : migrateLegacyGuest();
      const g = guest ?? (legacy ? { attendance: legacy, date: "2026-11-19" } : null);
      if (g?.attendance) {
        const r = rollover(g.attendance, localSubs, g.date, t);
        setAtt(r.att);
        setSubjects(r.subjects);
        attRef.current = r.att;
        subjectsRef.current = r.subjects;
        writeJSON(K.guest, { attendance: r.att, date: t });
        removeKeys(...LEGACY);
        ready = true;
      }
    }
    if (ready) setPhase("app");
    else if (!token) setPhase("onboarding");

    (async () => {
      if (token) {
        try {
          const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            acceptAuth({ token, ...data });
            setPhase("app");
          } else if (res.status === 401) {
            removeKeys(K.token, K.cache);
            setUser(null);
            if (attRef.current) {
              writeJSON(K.guest, { attendance: attRef.current, date: t });
              showNotice("Your session expired. Sign in again to keep syncing.", "warning", 6000);
            } else {
              setPhase("onboarding");
            }
          } else if (!ready) {
            setPhase("onboarding");
          }
        } catch {
          if (!ready) setPhase("onboarding");
        }
      }
      await backgroundErpSync();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Roll the day over if the app stays open past midnight.
  useEffect(() => {
    const check = () => {
      const t = todayISO();
      if (t === todayRef.current) return;
      const prev = todayRef.current;
      todayRef.current = t;
      setToday(t);
      if (attRef.current) {
        const r = rollover(attRef.current, subjectsRef.current, prev, t);
        if (r.rolled) commit(r.att, r.subjects);
      }
    };
    const id = setInterval(check, 60_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [commit]);

  const setTab = (t: Tab) => {
    setTabState(t);
    try {
      // location.replace keeps the hash in sync without going through Next's patched
      // history API, which would re-apply the static metadata title.
      window.location.replace(`#${t}`);
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updatePlan = (p: PlanMap) => {
    setPlan(p);
    writeJSON(K.plan, p);
  };

  // Browser tab title reflects the current view (and the live percentage on Overview).
  const titlePct = att ? computeMetrics(att, getHorizon(cal, today, att.todayHeld)).percentage : null;
  useEffect(() => {
    if (phase !== "app" || titlePct === null) {
      document.title = "AttendX — Attendance Tracker & Skip Planner";
      return;
    }
    const label = TABS.find((t) => t.id === tab)?.label ?? "Overview";
    document.title = tab === "overview" ? `${titlePct.toFixed(2)}% · AttendX` : `${label} · AttendX`;
  }, [phase, tab, titlePct]);

  const erpLogs = useMemo(() => getErpDay(datewise, today), [datewise, today]);
  const erpTotals = useMemo(() => sumLogs(erpLogs), [erpLogs]);

  const updateSubjects = (next: SubjectRecord[]) => {
    if (!att) return;
    const mh = next.reduce((a, s) => a + (s.todayHeld || 0), 0);
    const mp = next.reduce((a, s) => a + (s.todayPresent || 0), 0);
    commit({ ...att, todayHeld: erpTotals.held + mh, todayPresent: erpTotals.present + mp }, next);
  };

  // ---------- Render ----------

  if (phase === "loading") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6">
        <div className="app-backdrop" />
        <Brand size="lg" />
        <div className="h-1 w-32 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-full animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(90,169,255,0.8),transparent)] bg-[length:200%_100%]" />
        </div>
      </div>
    );
  }

  const sheets = (
    <>
      <ErpSheet open={sheet === "erp"} onClose={() => setSheet(null)} onSynced={applyErp} defaultAdmissionNo={user?.username} />
      <FeedbackSheet open={sheet === "feedback"} onClose={() => setSheet(null)} defaultContact={user?.username} signedIn={!!user} />
    </>
  );

  if (phase === "onboarding" || !att) {
    return (
      <>
        <Onboarding
          today={today}
          lecturesPerDay={cal.lecturesPerDay}
          onGuest={(a) => {
            commit(a, []);
            setPhase("app");
          }}
          onAuth={(r) => {
            acceptAuth(r);
            setPhase("app");
          }}
          onConnectErp={() => setSheet("erp")}
          onFeedback={() => setSheet("feedback")}
        />
        {sheets}
      </>
    );
  }

  const horizon = getHorizon(cal, today, att.todayHeld);
  const metrics = computeMetrics(att, horizon);
  const todayTotals = { held: att.todayHeld, present: att.todayPresent };

  return (
    <div className="min-h-dvh">
      <div className="app-backdrop" />
      <TopBar
        displayName={user?.name || user?.username || "Guest"}
        subtitle={user ? user.username : "Saved on this device only"}
        isGuest={!user}
        isSyncing={syncing}
        erpConnected={erpConnected}
        onSync={() => setSheet("erp")}
        onCalendar={() => setSheet("calendar")}
        onSettings={() => setSheet("settings")}
        onFeedback={() => setSheet("feedback")}
        onSignOut={signOutLocal}
        onCreateAccount={() => setSheet("auth")}
      />

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed inset-x-0 top-[calc(4.75rem+var(--safe-t))] z-50 flex justify-center px-4"
          >
            <div
              role="status"
              className={
                "flex max-w-md items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-sm shadow-2xl backdrop-blur-xl " +
                (notice.type === "success" ? "border-emerald-400/20 bg-emerald-950/80 text-emerald-200" : "border-amber-400/20 bg-amber-950/80 text-amber-200")
              }
            >
              {notice.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{notice.text}</span>
              <button type="button" onClick={() => setNotice(null)} className="ml-1 text-current opacity-60 hover:opacity-100" aria-label="Dismiss">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pb-dock mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "overview" && (
              <OverviewView
                metrics={metrics}
                horizon={horizon}
                today={today}
                lecturesPerDay={cal.lecturesPerDay}
                isWorkingDay={isWorkingDay(today, cal)}
                todayTotals={todayTotals}
                erpToday={erpTotals}
                subjects={subjects}
                erpConnected={erpConnected}
                onTarget={(v) => commit({ ...att, targetPercentage: v })}
                onConnect={() => setSheet("erp")}
                go={setTab}
              />
            )}
            {tab === "today" && (
              <TodayView
                today={today}
                lecturesPerDay={cal.lecturesPerDay}
                closedReason={holidayReason(today, cal)}
                erpLogs={erpLogs}
                erpTotals={erpTotals}
                todayTotals={todayTotals}
                subjects={subjects}
                onUpdateSubjects={updateSubjects}
                onSetSimpleToday={(h, p) => commit({ ...att, todayHeld: h, todayPresent: Math.min(h, p) })}
              />
            )}
            {tab === "planner" && (
              <PlannerView
                metrics={metrics}
                horizon={horizon}
                plan={plan}
                onPlanChange={updatePlan}
                today={today}
                datewise={datewise}
                lecturesPerDay={cal.lecturesPerDay}
              />
            )}
            {tab === "subjects" && (
              <SubjectsView
                subjects={subjects}
                targetPercentage={metrics.targetPercentage}
                onUpdateSubjects={(s) => commit(att, s)}
                onConnect={() => setSheet("erp")}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <Credits className="mt-12" />
      </main>

      <Dock tab={tab} onChange={setTab} />

      {sheets}
      <CalendarSheet
        open={sheet === "calendar"}
        onClose={() => setSheet(null)}
        today={today}
        cal={cal}
        datewise={datewise}
        subjects={subjects}
        plan={plan}
        todayTotals={todayTotals}
        targetPercentage={metrics.targetPercentage}
        onOpenPlanner={() => {
          setSheet(null);
          setTab("planner");
        }}
        onOpenToday={() => {
          setSheet(null);
          setTab("today");
        }}
      />
      <SettingsSheet
        open={sheet === "settings"}
        onClose={() => setSheet(null)}
        attendance={att}
        cal={cal}
        hasSubjects={subjects.length > 0}
        onSave={(a, p) => {
          commit(a);
          setPrefs(p);
          writeJSON(K.prefs, p);
        }}
      />
      <Sheet open={sheet === "auth"} onClose={() => setSheet(null)} size="sm" title="Save with an account" description="Keep your numbers across devices.">
        <div className="pt-1">
          <AuthForm
            initialMode="register"
            carryOver={{ attendance: att, subjects }}
            onSuccess={(r, mode) => {
              acceptAuth(r);
              setSheet(null);
              showNotice(mode === "register" ? "Account created" : "Signed in");
            }}
          />
        </div>
      </Sheet>
    </div>
  );
}
