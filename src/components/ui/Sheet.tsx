"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  dismissible?: boolean;
}

/** Bottom sheet on phones, centred dialog from `sm` up. */
export function Sheet({ open, onClose, title, description, icon, children, footer, size = "md", dismissible = true }: SheetProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, dismissible]);

  if (typeof document === "undefined") return null;

  const width = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" }[size];

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismissible ? onClose : undefined}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 48 }}
            transition={{ type: "spring", damping: 32, stiffness: 380 }}
            className={cn(
              "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-white/[0.08] bg-ink-850 shadow-2xl sm:rounded-[1.75rem]",
              width
            )}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" />
            {(title || dismissible) && (
              <div className="flex shrink-0 items-start gap-3 px-5 pb-3 pt-4 sm:px-6 sm:pt-6">
                {icon && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-200">
                    {icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {title && (
                    <h2 id={titleId} className="text-xl font-bold text-white">
                      {title}
                    </h2>
                  )}
                  {description && <p className="mt-0.5 text-sm text-zinc-400">{description}</p>}
                </div>
                {dismissible && (
                  <button type="button" onClick={onClose} className="icon-btn h-9 w-9 shrink-0" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
            {footer && (
              <div className="shrink-0 border-t border-white/[0.06] bg-ink-900/60 px-5 py-4 pb-[calc(1rem+var(--safe-b))] sm:px-6 sm:pb-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
