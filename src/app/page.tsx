"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AttendanceHero } from "@/components/AttendanceHero";
import { BunkCalculatorCard } from "@/components/BunkCalculatorCard";
import { MT2CalendarView } from "@/components/MT2CalendarView";
import { AuthModal } from "@/components/AuthModal";
import { EditBaselineModal } from "@/components/EditBaselineModal";
import { SubjectAuditModal } from "@/components/SubjectAuditModal";
import { UserProfile, AttendanceMetrics } from "@/lib/types";
import { Sparkles, Sliders, ShieldCheck, Heart } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<AttendanceMetrics>({
    wednesdayHeld: 421,
    wednesdayPresent: 316,
    wednesdayPercentage: 78.86,
    thursdayHeld: 3,
    thursdayPresent: 3,
    currentTotalHeld: 424,
    currentTotalPresent: 335,
    currentPercentage: 79.01,
    targetPercentage: 75,
    isEligibleForMT2: true,
    safeBunksRemaining: 22,
    safeDaysBunkable: 2,
    classesNeededFor75: 0,
    workingDaysUntilMT2: 6,
    totalLecturesUntilMT2: 45,
    minClassesToAttendBeforeMT2: 17,
    goofyQuote: "Safe zone achieved! You can enter the MT2 exam hall with your head held high.",
    statusTier: "safe",
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage token or fetch guest calculate
  useEffect(() => {
    const initApp = async () => {
      try {
        const token = localStorage.getItem("attendx_token");
        if (token) {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            if (data.metrics) setMetrics(data.metrics);
            setIsLoading(false);
            return;
          } else {
            localStorage.removeItem("attendx_token");
          }
        }

        // Check local baseline overrides in localStorage for guest
        const savedBaseline = localStorage.getItem("attendx_guest_baseline");
        const baselineData = savedBaseline
          ? JSON.parse(savedBaseline)
          : {
              totalHeld: 421,
              academicPresent: 316,
              thursdayHeld: 3,
              thursdayPresent: 3,
              targetPercentage: 75,
            };

        const calcRes = await fetch("/api/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(baselineData),
        });

        if (calcRes.ok) {
          const calcData = await calcRes.json();
          setMetrics(calcData.metrics);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  const handleAuthSuccess = (token: string, newUser: UserProfile, newMetrics?: AttendanceMetrics) => {
    localStorage.setItem("attendx_token", token);
    setUser(newUser);
    if (newMetrics) {
      setMetrics(newMetrics);
    } else {
      // Re-fetch me
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.metrics) setMetrics(d.metrics);
        });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("attendx_token");
    setUser(null);
  };

  const handleSaveSettings = async (data: {
    totalHeld: number;
    academicPresent: number;
    thursdayHeld: number;
    thursdayPresent: number;
    targetPercentage: number;
    branch?: string;
  }) => {
    const token = localStorage.getItem("attendx_token");
    if (token && user) {
      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const resData = await res.json();
        setUser(resData.user);
        setMetrics(resData.metrics);
      }
    } else {
      // Save locally for guest
      localStorage.setItem("attendx_guest_baseline", JSON.stringify(data));
      const calcRes = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (calcRes.ok) {
        const calcData = await calcRes.json();
        setMetrics(calcData.metrics);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between">
      {/* Navigation */}
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSubjects={() => setIsSubjectsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Attendance Hero */}
        <AttendanceHero metrics={metrics} />

        {/* Bunk Scorecard & Simulator */}
        <BunkCalculatorCard metrics={metrics} />

        {/* MT2 Roadmap Calendar */}
        <MT2CalendarView metrics={metrics} />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-[#070a12] py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span>AttendX v2.0 Web</span>
            <span>•</span>
            <span>Built for ABES Engineering College Students</span>
          </div>
          <div className="flex items-center space-x-1 text-slate-400">
            <span>Powered by Neon DB & Vercel</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

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
      />
    </div>
  );
}
