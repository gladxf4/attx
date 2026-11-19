"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export function TargetPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="chip chip-neutral hover:border-white/[0.16]">
        <Target className="h-3.5 w-3.5 text-zinc-400" />
        Target <span className="num font-semibold text-white">{value}%</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-zinc-500 transition", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 top-10 z-30 w-64 rounded-2xl border border-white/[0.08] bg-ink-850/95 p-3.5 shadow-2xl backdrop-blur-2xl"
          >
            <p className="eyebrow mb-2.5">Target attendance</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[75, 80, 85, 90].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    onChange(p);
                    setOpen(false);
                  }}
                  className={cn(
                    "num rounded-lg py-1.5 text-sm font-semibold transition",
                    value === p ? "bg-white text-ink-950" : "bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1]"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
              <span>Custom</span>
              <span className="num font-semibold text-white">{value}%</span>
            </div>
            <input
              type="range"
              min={60}
              max={95}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="range mt-2"
              aria-label="Custom target percentage"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
