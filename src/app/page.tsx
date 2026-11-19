"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AttendanceHero } from "@/components/AttendanceHero";
import { BunkCalculatorCard } from "@/components/BunkCalculatorCard";
import { MT2CalendarView } from "@/components/MT2CalendarView";
import { EditBaselineModal } from "@/components/EditBaselineModal";
import { SubjectAuditModal } from "@/components/SubjectAuditModal";
import { GuestOnboarding } from "@/components/GuestOnboarding";
import { UserProfile, AttendanceMetrics } from "@/lib/types";

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<AttendanceMetrics | null>(null);
  const [hasData, setHasData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);

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
        if (d.metrics) {
          setMetrics(d.metrics);
          setHasData(true);
        }
      });
  };

  const handleReset = () => {
    localStorage.removeItem("attendx_token");
    localStorage.removeItem("attendx_guest_data");
    setUser(null);
    setMetrics(null);
    setHasData(false);
  };

  const handleSaveSettings = async (data: {
    totalHeld: number;
    academicPresent: number;
    thursdayHeld: number;
    thursdayPresent: number;
    targetPercentage: number;
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
      localStorage.setItem("attendx_guest_data", JSON.stringify(data));
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 text-sm">
        Loading AttendX...
      </div>
    );
  }

  // If no user or guest data has been provided, show the clean gateway
  if (!hasData || !metrics) {
    return (
      <GuestOnboarding
        onCompleteGuest={handleCompleteGuest}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-between">
      <Navbar
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSubjects={() => setIsSubjectsOpen(true)}
        onReset={handleReset}
      />

      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <AttendanceHero metrics={metrics} />
        <BunkCalculatorCard metrics={metrics} />
        <MT2CalendarView metrics={metrics} />
      </main>

      <footer className="w-full border-t border-zinc-900 py-5 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-4xl px-4 flex items-center justify-between">
          <span>AttendX • ABES Attendance & Bunk Predictor</span>
          <button
            onClick={handleReset}
            className="text-zinc-500 hover:text-zinc-300 transition"
          >
            Clear Data / Change User
          </button>
        </div>
      </footer>

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
