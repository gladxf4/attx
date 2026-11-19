"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, LogIn, LogOut, MessageSquareHeart, RefreshCw, Settings2, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Brand } from "@/components/ui/Brand";
import { cn } from "@/lib/cn";

interface TopBarProps {
  displayName: string;
  subtitle: string;
  isGuest: boolean;
  isSyncing: boolean;
  erpConnected: boolean;
  onSync: () => void;
  onCalendar: () => void;
  onSettings: () => void;
  onFeedback: () => void;
  onSignOut: () => void;
  onCreateAccount: () => void;
}

export function TopBar(p: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menuOpen]);

  const initials =
    p.displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "G";

  const item = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-200 transition hover:bg-white/[0.06]";

  return (
    <header className="sticky top-0 z-40 pt-[var(--safe-t)]">
      <div className="absolute inset-0 -z-10 border-b border-white/[0.05] bg-ink-950/70 backdrop-blur-2xl" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[4.5rem] sm:px-6">
        <Brand />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={p.onSync}
            className={cn(
              "btn h-10 px-3 sm:px-4",
              p.erpConnected ? "btn-subtle" : "btn-primary",
              p.isSyncing && "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
            )}
            title={p.erpConnected ? "Sync with college ERP" : "Connect college ERP"}
          >
            <RefreshCw className={cn("h-4 w-4", p.isSyncing && "animate-spin")} />
            <span className="hidden sm:inline">{p.isSyncing ? "Syncing…" : p.erpConnected ? "Sync" : "Connect ERP"}</span>
          </button>

          <button type="button" onClick={p.onCalendar} className="btn btn-subtle h-10 px-3 sm:px-4" title="Calendar">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden md:inline">Calendar</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-gradient-to-br from-brand-500/30 to-sky-400/10 font-display text-sm font-bold text-white transition hover:border-white/[0.2] active:scale-95"
            >
              {p.isGuest ? <UserRound className="h-4 w-4" /> : initials}
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-12 w-64 origin-top-right rounded-2xl border border-white/[0.08] bg-ink-850/95 p-1.5 shadow-2xl backdrop-blur-2xl"
                >
                  <div className="px-3 pb-2.5 pt-2">
                    <p className="truncate text-sm font-semibold text-white">{p.displayName}</p>
                    <p className="truncate text-xs text-zinc-500">{p.subtitle}</p>
                  </div>
                  <div className="my-1 h-px bg-white/[0.06]" />
                  {p.isGuest && (
                    <button type="button" className={item} onClick={() => (setMenuOpen(false), p.onCreateAccount())}>
                      <LogIn className="h-4 w-4 text-brand-400" /> Save with an account
                    </button>
                  )}
                  <button type="button" className={item} onClick={() => (setMenuOpen(false), p.onSettings())}>
                    <Settings2 className="h-4 w-4 text-zinc-400" /> Settings
                  </button>
                  <button type="button" className={item} onClick={() => (setMenuOpen(false), p.onFeedback())}>
                    <MessageSquareHeart className="h-4 w-4 text-zinc-400" /> Feedback
                  </button>
                  <div className="my-1 h-px bg-white/[0.06]" />
                  <button
                    type="button"
                    className={cn(item, "text-rose-300 hover:bg-rose-500/10")}
                    onClick={() => (setMenuOpen(false), p.onSignOut())}
                  >
                    <LogOut className="h-4 w-4" /> {p.isGuest ? "Clear guest data" : "Sign out"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
