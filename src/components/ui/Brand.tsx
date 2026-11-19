import { cn } from "@/lib/cn";

export function Brand({ size = "md", className }: { size?: "md" | "lg" | "xl"; className?: string }) {
  const logo = {
    md: "h-9 w-9 xs:h-10 xs:w-10 sm:h-11 sm:w-11",
    lg: "h-14 w-14",
    xl: "h-20 w-20 sm:h-24 sm:w-24",
  }[size];
  const text = {
    md: "text-[1.4rem] xs:text-[1.6rem] sm:text-[1.8rem]",
    lg: "text-4xl",
    xl: "text-5xl sm:text-6xl",
  }[size];
  return (
    <div className={cn("flex items-center", size === "md" ? "gap-2.5" : "gap-3.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-256.png"
        alt=""
        width={256}
        height={220}
        className={cn(logo, "shrink-0 object-contain drop-shadow-[0_6px_20px_rgba(47,140,255,0.45)]")}
      />
      <span className={cn("font-display font-extrabold leading-none tracking-[-0.045em] text-white", text)}>
        Attend
        <span className="bg-gradient-to-br from-sky-300 via-brand-400 to-brand-600 bg-clip-text text-transparent">X</span>
      </span>
    </div>
  );
}

export function Credits({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-zinc-500", className)}>
      <span>
        Made by <span className="font-medium text-zinc-300">Akshatツ</span>
      </span>
      <span aria-hidden className="text-zinc-700">
        ·
      </span>
      <a href="https://x.com/gladxf4" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
        X
      </a>
      <a href="https://github.com/gladxf4" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
        GitHub
      </a>
    </div>
  );
}
