"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X, RotateCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { AttendanceHero } from "@/components/AttendanceHero";
import { BunkCalculatorCard } from "@/components/BunkCalculatorCard";
import { TodayPeriodTracker } from "@/components/TodayPeriodTracker";
import { AttendanceCalendarView } from "@/components/AttendanceCalendarView";
import { EditBaselineModal } from "@/components/EditBaselineModal";
import { SubjectAuditModal } from "@/components/SubjectAuditModal";
import { ERPSyncModal } from "@/components/ERPSyncModal";
import { FeedbackModal } from "@/components/FeedbackModal";
import { GuestOnboarding } from "@/components/GuestOnboarding";
import { UserProfile, AttendanceMetrics, SubjectRecord, DatewiseSubjectLog } from "@/lib/types";
import { calculateAttendanceMetrics } from "@/lib/attendanceEngine";
import { getTodayErpRecords } from "@/lib/calendarData";

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<AttendanceMetrics | null>(null);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [erpDatewise, setErpDatewise] = useState<Record<string, DatewiseSubjectLog[]>>({});
  const [hasData, setHasData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<{
    text: string;
    type: "success" | "warning" | "info";
  } | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const saveDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const periodTrackerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [activeCalendarDate, setActiveCalendarDate] = useState<string | null>(null);

  const showNotice = (text: string, type: "success" | "warning" | "info" = "info", duration = 4000) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setSyncNotice({ text, type });
    if (duration > 0) {
      noticeTimerRef.current = setTimeout(() => {
        setSyncNotice(null);
      }, duration);
    }
  };

  const handleOpenTodayDetail = () => {
    setActiveCalendarDate("2026-11-19");
    if (calendarRef.current) {
      calendarRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // 1. Instant 0ms synchronous local hydration from localStorage
  useEffect(() => {
    let localDataFound = false;
    const token = localStorage.getItem("attendx_token");

    try {
      const storedDatewise = localStorage.getItem("attendx_datewise_erp");
      if (storedDatewise) {
        try {
          setErpDatewise(JSON.parse(storedDatewise));
        } catch (e) {
          console.error(e);
        }
      }

      const storedSubs = localStorage.getItem("attendx_subjects");
      if (storedSubs) {
        try {
          setSubjects(JSON.parse(storedSubs));
        } catch (e) {
          console.error(e);
        }
      }

      // Check cached session for signed-in user to prevent flashing Guest mode
      const cachedUser = localStorage.getItem("attendx_cached_user");
      const cachedMetrics = localStorage.getItem("attendx_cached_metrics");
      if (token && cachedUser && cachedMetrics) {
        try {
          setUser(JSON.parse(cachedUser));
          setMetrics(JSON.parse(cachedMetrics));
          setHasData(true);
          localDataFound = true;
        } catch (e) {
          console.error("Cached session parse error:", e);
        }
      }

      // Check for cached guest baseline if no token
      if (!token) {
        const savedGuest = localStorage.getItem("attendx_guest_data");
        if (savedGuest) {
          try {
            const parsed = JSON.parse(savedGuest);
            const todayLogs = getTodayErpRecords(storedDatewise ? JSON.parse(storedDatewise) : {});
            const todayErpHeld = todayLogs.reduce((acc, l) => acc + (l.held || 1), 0);
            const todayErpPresent = todayLogs.reduce(
              (acc, l) => acc + (l.present !== undefined ? l.present : l.status === "P" ? (l.held || 1) : 0),
              0
            );
            const effectiveHeld = parsed.thursdayHeld !== undefined && parsed.thursdayHeld > 0 ? parsed.thursdayHeld : todayErpHeld;
            const effectivePres = parsed.thursdayPresent !== undefined && parsed.thursdayPresent > 0 ? parsed.thursdayPresent : todayErpPresent;

            const synchronousMetrics = calculateAttendanceMetrics(
              parsed.totalHeld,
              parsed.academicPresent,
              effectiveHeld,
              effectivePres,
              parsed.targetPercentage || 75,
              parsed.concessionBuffer,
              parsed.officialPercentage
            );
            setMetrics(synchronousMetrics);
            setHasData(true);
            localDataFound = true;
          } catch (e) {
            console.error("Local metrics parse error:", e);
          }
        }
      }
    } catch (err) {
      console.error("Local storage access error:", err);
    }

    if (localDataFound) {
      setIsLoading(false);
    } else if (!token) {
      // Neither token nor guest data exists
      setIsLoading(false);
      setHasData(false);
    }
    // If token exists but no cached metrics yet, keep isLoading true until triggerBackgroundSync resolves

    triggerBackgroundSync(localDataFound);
  }, []);

  const triggerBackgroundSync = async (hasLocalData: boolean) => {
    try {
      const token = localStorage.getItem("attendx_token");
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.user) {
              setUser(data.user);
              localStorage.setItem("attendx_cached_user", JSON.stringify(data.user));
              if (data.user?.custom_subjects && Array.isArray(data.user.custom_subjects) && data.user.custom_subjects.length > 0) {
                setSubjects(data.user.custom_subjects);
              }
              if (data.metrics) {
                setMetrics(data.metrics);
                localStorage.setItem("attendx_cached_metrics", JSON.stringify(data.metrics));
                setHasData(true);
              }
            }
          } else {
            localStorage.removeItem("attendx_token");
            localStorage.removeItem("attendx_cached_user");
            localStorage.removeItem("attendx_cached_metrics");
            setUser(null);
            setHasData(false);
          }
        } catch (e) {
          console.error("Background auth error:", e);
        } finally {
          setIsLoading(false);
        }
      }

      // Quiet ERP background synchronization
      const storedSession = localStorage.getItem("attendx_erp_session");
      if (!storedSession) return;

      const session = JSON.parse(storedSession);
      if (!session?.cookie) return;

      setIsSyncing(true);

      const res = await fetch("/api/erp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refresh_session",
          erpSessionCookie: session.cookie,
          erpId: session.erpId || "",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.totalHeld && data.academicPresent) {
          handleImportFromERP(
            Number(data.totalHeld),
            Number(data.academicPresent),
            Number(data.concessionBuffer || 0),
            data.officialPercentage ? Number(data.officialPercentage) : undefined,
            data.subjects,
            data.datewiseAttendance
          );
          showNotice("Attendance records synchronized with ERP", "success", 3000);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.expired) {
          localStorage.removeItem("attendx_erp_session");
          showNotice("ERP session expired. Tap Sync ERP to reconnect", "warning", 6000);
        }
      }
    } catch (err) {
      console.error("Auto ERP background sync error:", err);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  const handleCompleteGuest = async (data: {
    totalHeld: number;
    academicPresent: number;
    thursdayHeld: number;
    thursdayPresent: number;
    targetPercentage: number;
    concessionBuffer?: number;
    officialPercentage?: number;
  }) => {
    localStorage.setItem("attendx_guest_data", JSON.stringify(data));
    try {
      const calcRes = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (calcRes.ok) {
        const calcData = await calcRes.json();
        setMetrics(calcData.metrics);
        setHasData(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (token: string, newUser: UserProfile) => {
    localStorage.setItem("attendx_token", token);
    setUser(newUser);
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.custom_subjects && Array.isArray(d.user.custom_subjects) && d.user.custom_subjects.length > 0) {
          setSubjects(d.user.custom_subjects);
        }
        if (d.metrics) {
          setMetrics(d.metrics);
          setHasData(true);
        }
      });
  };

  const handleReset = () => {
    localStorage.removeItem("attendx_token");
    localStorage.removeItem("attendx_guest_data");
    localStorage.removeItem("attendx_subjects");
    localStorage.removeItem("attendx_erp_session");
    localStorage.removeItem("attendx_datewise_erp");
    setUser(null);
    setMetrics(null);
    setSubjects([]);
    setErpDatewise({});
    setHasData(false);
  };

  const handleSaveSettings = async (data: {
    totalHeld: number;
    academicPresent: number;
    thursdayHeld: number;
    thursdayPresent: number;
    targetPercentage: number;
    concessionBuffer?: number;
    custom_subjects?: SubjectRecord[];
  }) => {
    const token = localStorage.getItem("attendx_token");
    const bufferVal = data.concessionBuffer !== undefined ? data.concessionBuffer : (metrics?.concessionBuffer || 0);
    const subList = data.custom_subjects !== undefined ? data.custom_subjects : subjects;

    if (token) {
      try {
        const res = await fetch("/api/attendance", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...data,
            factorBuffer: bufferVal,
            custom_subjects: subList,
          }),
        });
        if (res.ok) {
          const resData = await res.json();
          setUser(resData.user);
          if (!saveDebounceTimerRef.current && resData.metrics) {
            setMetrics(resData.metrics);
          }
          if (resData.user?.custom_subjects && !saveDebounceTimerRef.current) {
            setSubjects(resData.user.custom_subjects);
          }
          setHasData(true);
        }
      } catch (err) {
        console.error("Save settings network error:", err);
      }
    } else {
      const guestPayload = { ...data, concessionBuffer: bufferVal };
      localStorage.setItem("attendx_guest_data", JSON.stringify(guestPayload));
    }
  };

  const handleImportFromERP = (
    held: number,
    present: number,
    buffer: number = 0,
    officialPct?: number,
    importedSubjects?: SubjectRecord[],
    datewiseAtt?: Record<string, any[]>
  ) => {
    if (datewiseAtt && Object.keys(datewiseAtt).length > 0) {
      setErpDatewise(datewiseAtt);
      try {
        localStorage.setItem("attendx_datewise_erp", JSON.stringify(datewiseAtt));
      } catch (e) {
        console.error(e);
      }
    }

    let finalBuffer = buffer;
    if (officialPct !== undefined && officialPct > 0 && held > 0) {
      finalBuffer = Math.max(0, Math.round((officialPct / 100) * held) - present);
    }

    const baseSubjects = importedSubjects && importedSubjects.length > 0 ? importedSubjects : subjects;
    const cleanedSubjects = baseSubjects.map((s) => ({
      ...s,
      todayHeld: 0,
      todayPresent: 0,
    }));

    setSubjects(cleanedSubjects);
    try {
      localStorage.setItem("attendx_subjects", JSON.stringify(cleanedSubjects));
    } catch (e) {
      console.error(e);
    }

    // Determine today's periods already officially recorded on ERP
    const todayLogs = getTodayErpRecords(datewiseAtt || erpDatewise);
    const todayErpHeld = todayLogs.reduce((acc, l) => acc + (l.held || 1), 0);
    const todayErpPresent = todayLogs.reduce(
      (acc, l) => acc + (l.present !== undefined ? l.present : l.status === "P" ? (l.held || 1) : 0),
      0
    );

    // If held tally already includes today's records (e.g. 426 held vs 421 yesterday), baseline is previous days
    const baseHeld = Math.max(0, held - todayErpHeld);
    const basePresent = Math.max(0, present - todayErpPresent);

    const updated = {
      totalHeld: baseHeld,
      academicPresent: basePresent,
      thursdayHeld: todayErpHeld,
      thursdayPresent: todayErpPresent,
      targetPercentage: metrics?.targetPercentage ?? 75,
      concessionBuffer: finalBuffer,
      officialPercentage: officialPct,
      custom_subjects: cleanedSubjects,
    };
    handleSaveSettings(updated);
  };

  const handleUpdateTarget = (newTarget: number) => {
    if (!metrics) return;
    const updated = {
      totalHeld: metrics.wednesdayHeld,
      academicPresent: metrics.wednesdayPresent,
      thursdayHeld: metrics.thursdayHeld,
      thursdayPresent: metrics.thursdayPresent,
      targetPercentage: newTarget,
      concessionBuffer: metrics.concessionBuffer,
      custom_subjects: subjects,
    };
    handleSaveSettings(updated);
  };

  const handleUpdateSubjects = (updatedSubjects: SubjectRecord[]) => {
    setSubjects(updatedSubjects);
    try {
      localStorage.setItem("attendx_subjects", JSON.stringify(updatedSubjects));
    } catch (e) {
      console.error(e);
    }

    const todayLogs = getTodayErpRecords(erpDatewise);
    const todayErpHeld = todayLogs.reduce((acc, l) => acc + (l.held || 1), 0);
    const todayErpPresent = todayLogs.reduce(
      (acc, l) => acc + (l.present !== undefined ? l.present : l.status === "P" ? (l.held || 1) : 0),
      0
    );

    const userHeld = updatedSubjects.reduce((acc, s) => acc + (s.todayHeld || 0), 0);
    const userPres = updatedSubjects.reduce((acc, s) => acc + (s.todayPresent || 0), 0);

    const totalHeldToday = todayErpHeld + userHeld;
    const totalPresentToday = todayErpPresent + userPres;

    if (metrics) {
      const immediate = calculateAttendanceMetrics(
        metrics.wednesdayHeld,
        metrics.wednesdayPresent,
        totalHeldToday,
        totalPresentToday,
        metrics.targetPercentage || 75,
        metrics.concessionBuffer,
        metrics.wednesdayPercentage
      );
      setMetrics(immediate);
      localStorage.setItem("attendx_cached_metrics", JSON.stringify(immediate));

      if (saveDebounceTimerRef.current) {
        clearTimeout(saveDebounceTimerRef.current);
      }
      saveDebounceTimerRef.current = setTimeout(() => {
        saveDebounceTimerRef.current = null;
        handleSaveSettings({
          totalHeld: metrics.wednesdayHeld,
          academicPresent: metrics.wednesdayPresent,
          thursdayHeld: totalHeldToday,
          thursdayPresent: totalPresentToday,
          targetPercentage: metrics.targetPercentage || 75,
          concessionBuffer: metrics.concessionBuffer,
          custom_subjects: updatedSubjects,
        });
      }, 800);
    }
  };

  const scrollToPeriodTracker = () => {
    if (periodTrackerRef.current) {
      periodTrackerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen apple-canvas flex flex-col items-center justify-center space-y-4">
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="relative flex items-center justify-center"
        >
          <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-white/[0.1] p-2.5 flex items-center justify-center shadow-2xl">
            <img src="/logo.png" alt="AttendX" className="h-full w-full object-contain" />
          </div>
          <div className="absolute inset-0 rounded-2xl border border-white/20 animate-ping opacity-20 pointer-events-none" />
        </motion.div>
        <div className="flex flex-col items-center space-y-1">
          <span className="text-sm font-semibold tracking-tight text-white font-sans">
            AttendX
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">
            Loading workspace...
          </span>
        </div>
      </div>
    );
  }

  if (!hasData || !metrics) {
    return (
      <>
        <GuestOnboarding
          onCompleteGuest={handleCompleteGuest}
          onLoginSuccess={handleLoginSuccess}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
        />
        <FeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          defaultContact={user?.username}
          attendancePct={undefined}
        />
      </>
    );
  }

  const hasERP = metrics.wednesdayHeld > 0 || (user?.totalHeld ?? 0) > 0;

  return (
    <div className="apple-canvas min-h-screen text-zinc-100 flex flex-col justify-between selection:bg-white/10 selection:text-white">
      <Navbar
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSubjects={() => setIsSubjectsOpen(true)}
        onOpenSync={() => setIsSyncOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenPeriodTracker={handleOpenTodayDetail}
        onReset={handleReset}
        subjectCount={subjects.length}
        hasERPInitialized={hasERP}
        isSyncing={isSyncing}
      />

      {/* Sync Status Banner */}
      <AnimatePresence>
        {syncNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-auto w-full max-w-4xl px-3.5 sm:px-6 pt-2"
          >
            <div
              className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs border backdrop-blur-md ${
                syncNotice.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : syncNotice.type === "warning"
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                  : "bg-zinc-900/90 border-white/[0.08] text-zinc-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                {syncNotice.type === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : syncNotice.type === "warning" ? (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                ) : (
                  <RotateCw className="h-3.5 w-3.5 text-zinc-400 animate-spin shrink-0" />
                )}
                <span>{syncNotice.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setSyncNotice(null)}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto w-full max-w-4xl px-3.5 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Attendance Hero */}
        <AttendanceHero
          metrics={metrics}
          onOpenSync={() => setIsSyncOpen(true)}
          onOpenTodayDetailModal={handleOpenTodayDetail}
          onUpdateTarget={handleUpdateTarget}
          hasERPInitialized={hasERP}
        />

        {/* Daily Period Tracker (Collapsed by default) */}
        {subjects.length > 0 && (
          <div ref={periodTrackerRef} id="today-period-tracker">
            <TodayPeriodTracker
              subjects={subjects}
              erpTodayLogs={getTodayErpRecords(erpDatewise)}
              onUpdateSubjects={handleUpdateSubjects}
            />
          </div>
        )}

        {/* Attendance Simulator */}
        <BunkCalculatorCard
          metrics={metrics}
          onUpdateTarget={handleUpdateTarget}
        />

        {/* Datewise Attendance Calendar & What-If Schedule Forecast */}
        <div ref={calendarRef} id="attendance-calendar-view">
          <AttendanceCalendarView
            metrics={metrics}
            subjects={subjects}
            erpDatewise={erpDatewise}
            activeModalDateStr={activeCalendarDate}
            onCloseModal={() => setActiveCalendarDate(null)}
            onScrollToPeriodTracker={scrollToPeriodTracker}
          />
        </div>
      </main>

      <footer className="w-full border-t border-white/[0.06] py-7 text-xs text-zinc-400 bg-black/20">
        <div className="mx-auto max-w-4xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-zinc-200">AttendX</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">Precision Attendance</span>
            </div>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <div className="text-zinc-400">
              Designed & built by{" "}
              <span className="text-zinc-200 font-medium">Akshat Sinha</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://x.com/gladxf4"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition flex items-center space-x-1"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>@gladxf4</span>
            </a>
            <a
              href="https://github.com/gladxf4"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition flex items-center space-x-1"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>
            <span className="text-zinc-600">•</span>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="text-zinc-400 hover:text-white transition"
            >
              Feedback
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EditBaselineModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        metrics={metrics}
        onSave={handleSaveSettings}
      />

      <SubjectAuditModal
        isOpen={isSubjectsOpen}
        onClose={() => setIsSubjectsOpen(false)}
        targetPercentage={metrics.targetPercentage}
        initialSubjects={subjects}
        onSaveSubjects={handleUpdateSubjects}
      />

      <ERPSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        onImportNumbers={handleImportFromERP}
        defaultAdmissionNo={user?.username}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        defaultContact={user?.username}
        attendancePct={metrics?.currentPercentage}
      />
    </div>
  );
}
