"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { UserProfile, AttendanceMetrics, SubjectRecord } from "@/lib/types";

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<AttendanceMetrics | null>(null);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [hasData, setHasData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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
        const token = localStorage.getItem("attendx_token");
        if (token) {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);

            // Load subjects if returned from db or localStorage
            if (data.user?.custom_subjects && Array.isArray(data.user.custom_subjects) && data.user.custom_subjects.length > 0) {
              setSubjects(data.user.custom_subjects);
            } else {
              const storedSubs = localStorage.getItem("attendx_subjects");
              if (storedSubs) {
                try {
                  setSubjects(JSON.parse(storedSubs));
                } catch (e) {
                  console.error(e);
                }
              }
            }

            if (data.metrics) {
              setMetrics(data.metrics);
              setHasData(true);
              setIsLoading(false);
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
          const storedSubs = localStorage.getItem("attendx_subjects");
          if (storedSubs) {
            try {
              setSubjects(JSON.parse(storedSubs));
            } catch (e) {
              console.error(e);
            }
          }

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
            return;
          }
        }

        // Neither user nor guest data found -> show onboarding screen
        setHasData(false);
      } catch (err) {
        console.error("Init error:", err);
        setHasData(false);
      } finally {
        setIsLoading(false);
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
    setUser(null);
    setMetrics(null);
    setSubjects([]);
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
        setMetrics(resData.metrics);
        if (resData.user?.custom_subjects) {
          setSubjects(resData.user.custom_subjects);
        }
        setHasData(true);
      }
    } else {
      const guestPayload = { ...data, concessionBuffer: bufferVal };
      localStorage.setItem("attendx_guest_data", JSON.stringify(guestPayload));
      const calcRes = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guestPayload),
      });
      if (calcRes.ok) {
        const calcData = await calcRes.json();
        setMetrics(calcData.metrics);
      }
    }
  };

  const handleImportFromERP = (
    held: number,
    present: number,
    buffer: number = 0,
    officialPct?: number,
    importedSubjects?: SubjectRecord[]
  ) => {
    let finalBuffer = buffer;
    if (officialPct !== undefined && officialPct > 0 && held > 0) {
      finalBuffer = Math.max(0, Math.round((officialPct / 100) * held) - present);
    }

    // ERP is the authoritative ground truth: reset any temporary manual markings for today
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
      thursdayHeld: 0, // Reset today's manual increment: ERP provides the full official total
      thursdayPresent: 0,
      targetPercentage: metrics?.targetPercentage ?? 75,
      concessionBuffer: finalBuffer,
      officialPercentage: officialPct,
      custom_subjects: cleanedSubjects,
    };
    handleSaveSettings(updated);
  };

  // Update target threshold (e.g. 75, 80, 85)
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

  // Today Period Tracker: update individual periods and totals
  const handleUpdateTodayTotals = (held: number, present: number) => {
    if (!metrics) return;
    const updated = {
      totalHeld: metrics.wednesdayHeld,
      academicPresent: metrics.wednesdayPresent,
      thursdayHeld: held,
      thursdayPresent: present,
      targetPercentage: metrics.targetPercentage || 75,
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
      const updated = {
        totalHeld: metrics.wednesdayHeld,
        academicPresent: metrics.wednesdayPresent,
        thursdayHeld: newHeld,
        thursdayPresent: newPres,
        targetPercentage: metrics.targetPercentage || 75,
        concessionBuffer: metrics.concessionBuffer,
        custom_subjects: updatedSubjects,
      };
      handleSaveSettings(updated);
    }
  };

  const scrollToPeriodTracker = () => {
    if (periodTrackerRef.current) {
      periodTrackerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 text-xs font-mono">
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
      />

      <main className="mx-auto w-full max-w-4xl px-3.5 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Attendance Hero with Target Threshold Selector and Clean Visuals */}
        <AttendanceHero
          metrics={metrics}
          onOpenSync={() => setIsSyncOpen(true)}
          onOpenTodayDetailModal={handleOpenTodayDetail}
          onUpdateTarget={handleUpdateTarget}
          hasERPInitialized={hasERP}
        />

        {/* Daily Period Tracker (Max 8 periods, Lecture vs Lab split) */}
        {subjects.length > 0 && (
          <div ref={periodTrackerRef} id="today-period-tracker">
            <TodayPeriodTracker
              subjects={subjects}
              onUpdateSubjects={handleUpdateSubjects}
              onUpdateTodayTotals={handleUpdateTodayTotals}
            />
          </div>
        )}

        {/* Interactive Custom Simulator (Bunk & Recovery Simulation) */}
        <BunkCalculatorCard
          metrics={metrics}
          onUpdateTarget={handleUpdateTarget}
        />

        {/* Datewise Attendance Calendar & What-If Schedule Forecast */}
        <div ref={calendarRef} id="attendance-calendar-view">
          <AttendanceCalendarView
            metrics={metrics}
            subjects={subjects}
            activeModalDateStr={activeCalendarDate}
            onCloseModal={() => setActiveCalendarDate(null)}
          />
        </div>
      </main>

      <footer className="w-full border-t border-white/[0.06] py-6 text-center text-xs text-zinc-500 bg-transparent">
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
          <button
            onClick={handleReset}
            className="text-zinc-500 hover:text-zinc-300 transition text-[11px]"
          >
            Clear Local Data
          </button>
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