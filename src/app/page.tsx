"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<AttendanceMetrics | null>(null);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [erpDatewise, setErpDatewise] = useState<Record<string, DatewiseSubjectLog[]>>({});
  const [hasData, setHasData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const saveDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const periodTrackerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [activeCalendarDate, setActiveCalendarDate] = useState<string | null>(null);

  const handleOpenTodayDetail = () => {
    setActiveCalendarDate("2026-11-19");
    if (calendarRef.current) {
      calendarRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const init = async () => {
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

        const token = localStorage.getItem("attendx_token");
        if (token) {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);

            if (data.user?.custom_subjects && Array.isArray(data.user.custom_subjects) && data.user.custom_subjects.length > 0) {
              setSubjects(data.user.custom_subjects);
            }

            if (data.metrics) {
              setMetrics(data.metrics);
              setHasData(true);
              setIsLoading(false);
              triggerBackgroundErpSync();
              return;
            }
          } else {
            localStorage.removeItem("attendx_token");
          }
        }

        // Check if guest data exists in browser
        const savedGuest = localStorage.getItem("attendx_guest_data");
        if (savedGuest) {
          const parsed = JSON.parse(savedGuest);

          const calcRes = await fetch("/api/calculate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed),
          });
          if (calcRes.ok) {
            const calcData = await calcRes.json();
            setMetrics(calcData.metrics);
            setHasData(true);
            setIsLoading(false);
            triggerBackgroundErpSync();
            return;
          }
        }

        setHasData(false);
      } catch (err) {
        console.error("Init error:", err);
        setHasData(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Auto-refresh ERP data on page load if session exists
    const triggerBackgroundErpSync = async () => {
      try {
        const storedSession = localStorage.getItem("attendx_erp_session");
        if (!storedSession) return;

        const session = JSON.parse(storedSession);
        if (!session.cookie) return;

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
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          if (errData.expired) {
            localStorage.removeItem("attendx_erp_session");
          }
        }
      } catch (err) {
        console.error("Auto ERP sync error:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    init();
  }, []);

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

    const updated = {
      totalHeld: held,
      academicPresent: present,
      thursdayHeld: 0,
      thursdayPresent: 0,
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

    const newHeld = updatedSubjects.reduce((acc, s) => acc + (s.todayHeld || 0), 0);
    const newPres = updatedSubjects.reduce((acc, s) => acc + (s.todayPresent || 0), 0);

    if (metrics) {
      const immediate = calculateAttendanceMetrics(
        metrics.wednesdayHeld,
        metrics.wednesdayPresent,
        newHeld,
        newPres,
        metrics.targetPercentage || 75,
        metrics.concessionBuffer,
        metrics.wednesdayPercentage
      );
      setMetrics(immediate);

      if (saveDebounceTimerRef.current) {
        clearTimeout(saveDebounceTimerRef.current);
      }
      saveDebounceTimerRef.current = setTimeout(() => {
        saveDebounceTimerRef.current = null;
        handleSaveSettings({
          totalHeld: metrics.wednesdayHeld,
          academicPresent: metrics.wednesdayPresent,
          thursdayHeld: newHeld,
          thursdayPresent: newPres,
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
      <div className="min-h-screen apple-canvas flex items-center justify-center text-zinc-400 text-xs font-mono">
        Loading AttendX...
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

      <footer className="w-full border-t border-white/[0.06] py-6 text-xs text-zinc-500">
        <div className="mx-auto max-w-4xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-zinc-300">AttendX</span>
            <span>•</span>
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="text-zinc-500 hover:text-zinc-300 transition"
            >
              Feedback
            </button>
          </div>
          <span className="text-[11px] text-zinc-600">
            Precision attendance engine for college students
          </span>
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
