"use client";

import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { ReactNode, useId } from "react";
import { cn } from "@/lib/cn";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
  full,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  size?: "sm" | "md";
  className?: string;
  full?: boolean;
}) {
  const id = useId();
  return (
    <div
      role="tablist"
      className={cn(
        "relative inline-flex items-center rounded-xl border border-white/[0.07] bg-black/30 p-1",
        full && "flex w-full",
        className
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative z-10 whitespace-nowrap rounded-lg font-medium transition-colors",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
              full && "flex-1",
              active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 -z-10 rounded-lg border border-white/[0.08] bg-white/[0.09] shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({
  value,
  min = 0,
  max,
  onChange,
  label,
  size = "md",
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
  label?: ReactNode;
  size?: "sm" | "md";
}) {
  const btn = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-black/30 p-1">
      <button
        type="button"
        aria-label="Decrease"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(btn, "flex items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/[0.08] active:scale-90 disabled:opacity-25")}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className={cn("num min-w-[3.25rem] text-center font-semibold text-white", size === "sm" ? "text-sm" : "text-[0.95rem]")}>
        {label ?? value}
      </span>
      <button
        type="button"
        aria-label="Increase"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(btn, "flex items-center justify-center rounded-lg text-zinc-300 transition hover:bg-white/[0.08] active:scale-90 disabled:opacity-25")}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ProgressRing({
  value,
  target,
  size = 200,
  stroke = 14,
  tone,
  children,
}: {
  value: number;
  target: number;
  size?: number;
  stroke?: number;
  tone: "safe" | "caution" | "critical";
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const colors = {
    safe: ["#34d399", "#10b981"],
    caution: ["#fcd34d", "#f59e0b"],
    critical: ["#fb7185", "#e11d48"],
  }[tone];
  const gid = useId().replace(/:/g, "");
  const angle = (Math.max(0, Math.min(100, target)) / 100) * 2 * Math.PI - Math.PI / 2;
  const tx = size / 2 + r * Math.cos(angle);
  const ty = size / 2 + r * Math.sin(angle);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#g${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v / 100) }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 10px ${colors[1]}55)` }}
        />
        <circle cx={tx} cy={ty} r={stroke / 2 + 2} fill="#07080c" stroke="#fff" strokeWidth={2.5} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

export function Meter({ held, present, total, erpHeld = 0, erpPresent = 0 }: { held: number; present: number; total: number; erpHeld?: number; erpPresent?: number }) {
  // Visual period meter: ERP-marked first, then self-marked.
  const slots = Math.max(total, held);
  return (
    <div className="flex items-center gap-1" aria-label={`${held} of ${total} periods marked`}>
      {Array.from({ length: slots }).map((_, i) => {
        let cls = "bg-white/[0.08]";
        if (i < erpHeld) cls = i < erpPresent ? "bg-emerald-400" : "bg-rose-400";
        else if (i < held) cls = i - erpHeld < present - erpPresent ? "bg-brand-400" : "bg-amber-400";
        return <span key={i} className={cn("h-2 flex-1 min-w-[10px] max-w-[22px] rounded-full transition-colors", cls)} />;
      })}
    </div>
  );
}
