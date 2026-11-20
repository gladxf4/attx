"use client";

import { motion } from "framer-motion";
import { BookOpen, CalendarCheck2, Gauge, ListChecks, Route } from "lucide-react";
import { cn } from "@/lib/cn";

export type Tab = "overview" | "today" | "unmarked" | "planner" | "subjects";

export const TABS: { id: Tab; label: string; icon: typeof Gauge }[] = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "today", label: "Today", icon: CalendarCheck2 },
  { id: "unmarked", label: "Unmarked", icon: ListChecks },
  { id: "planner", label: "Planner", icon: Route },
  { id: "subjects", label: "Subjects", icon: BookOpen },
];

/** Floating dock: full-width tab bar on phones, a compact mac-style dock on larger screens. */
export function Dock({ tab, onChange, badges }: { tab: Tab; onChange: (t: Tab) => void; badges?: Partial<Record<Tab, number>> }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(0.75rem+var(--safe-b))] sm:pb-6"
    >
      <div className="flex w-full max-w-md items-stretch gap-1 rounded-[1.6rem] border border-white/[0.09] bg-ink-850/80 p-1.5 shadow-dock backdrop-blur-2xl sm:w-auto sm:gap-1.5 sm:p-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          const badge = badges?.[id];
          return (
            <motion.button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active ? "page" : undefined}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[0.7rem] font-medium transition-colors sm:min-w-[5.5rem] sm:flex-row sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm",
                active ? "text-white" : "text-zinc-400 hover:text-zinc-100"
              )}
            >
              {active && (
                <motion.span
                  layoutId="dock-active"
                  className="absolute inset-0 -z-10 rounded-2xl border border-white/[0.08] bg-white/[0.08]"
                  transition={{ type: "spring", stiffness: 480, damping: 36 }}
                />
              )}
              <span className="relative">
                <Icon className={cn("h-5 w-5 sm:h-[1.15rem] sm:w-[1.15rem]", active && "text-brand-400")} strokeWidth={active ? 2.3 : 2} />
                {badge ? (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[0.6rem] font-bold text-white">
                    {badge}
                  </span>
                ) : null}
              </span>
              <span>{label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
