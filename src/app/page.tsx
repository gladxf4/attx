"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AttendanceHero } from "@/components/AttendanceHero";
import { BunkCalculatorCard } from "@/components/BunkCalculatorCard";
import { MT2CalendarView } from "@/components/MT2CalendarView";
import { EditBaselineModal } from "@/components/EditBaselineModal";
import { SubjectAuditModal } from "@/components/SubjectAuditModal";
import { ERPSyncModal } from "@/components/ERPSyncModal";
import { GuestOnboarding } from "@/components/GuestOnboarding";
import { UserProfile, AttendanceMetrics } from "@/lib/types";

export default function Home() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<AttendanceMetrics | null>(null);
  const [hasData, setHasData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);

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
    concessionBuffer?: number;
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
    concessionBuffer?: number;
  }) => {
    const token = localStorage.getItem("attendx_token");
    const bufferVal = data.concessionBuffer !== undefined ? data.concessionBuffer : (metrics?.concessionBuffer || 0);

    if (token && user) {
      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          factorBuffer: bufferVal,
        }),
      });
      if (res.ok) {
        const resData = await res.json();
        setUser(resData.user);
        setMetrics(resData.metrics);
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

  const handleImportFromERP = (held: number, present: number, buffer: number = 16) => {
    const updated = {
      totalHeld: held,
      academicPresent: present,
      thursdayHeld: metrics?.thursdayHeld ?? 8,
      thursdayPresent: metrics?.thursdayPresent ?? 0,
      targetPercentage: metrics?.targetPercentage ?? 75,
      concessionBuffer: buffer,
    };
    handleSaveSettings(updated);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-500 text-xs font-mono">
        Loading...
      </div>
    );
  }

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
        onOpenSync={() => setIsSyncOpen(true)}
        onReset={handleReset}
      />

      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        <AttendanceHero metrics={metrics} />
        <BunkCalculatorCard metrics={metrics} />
        <MT2CalendarView metrics={metrics} />
      </main>

      <footer className="w-full border-t border-zinc-900 py-4 text-center text-xs text-zinc-500">
        <div className="mx-auto max-w-4xl px-4 flex items-center justify-between">
          <span>AttendX</span>
          <button
            onClick={handleReset}
            className="text-zinc-500 hover:text-zinc-300 transition"
          >
            Clear Data / Change Preset
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

      <ERPSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        onImportNumbers={handleImportFromERP}
      />
    </div>
  );
}
