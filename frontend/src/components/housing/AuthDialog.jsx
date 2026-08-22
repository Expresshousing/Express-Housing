import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, KeyRound, ShieldCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthSwitch from "@/components/ui/auth-switch";
import { useTheme } from "@/context/ThemeContext";

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export default function AuthDialog({ open, onClose, initialMode = "login", returnTo = null }) {
  const { colors: c, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector("[data-auth-first]")?.focus();
    }, reduceMotion ? 0 : 180);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll(focusableSelector));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [onClose, open, reduceMotion]);

  if (typeof document === "undefined") return null;

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.24, ease: [0.22, 1, 0.36, 1] };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
          style={{ background: `${c.TEXT}8F`, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          data-testid="auth-dialog-backdrop"
        >
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Express Housing account access"
            className="relative grid h-[100dvh] min-h-0 w-full overflow-hidden border sm:h-[calc(100dvh-48px)] sm:max-h-[680px] sm:max-w-[980px] sm:grid-cols-[0.9fr_1.1fr] sm:rounded-[20px]"
            style={{ background: c.CARD, borderColor: c.BORDER, color: c.TEXT, boxShadow: isDarkMode ? "none" : "0 8px 30px rgba(0,0,0,0.12)" }}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 18, scale: reduceMotion ? 1 : 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.99 }}
            transition={transition}
            data-testid="auth-dialog"
          >
            <div className="relative hidden h-full min-h-0 overflow-hidden sm:block">
              <img
                src="/images/operator-portfolio/broad-noble-private-terrace.jpg"
                alt="Private terrace at an Express Housing building"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: "center 52%" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/20" />
              <div className="absolute inset-x-0 bottom-0 p-8 text-white lg:p-10">
                <div className="flex items-center gap-3">
                  <span className="h-0.5 w-8 bg-[#FF385C]" aria-hidden="true" />
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/80">Your stay, protected</p>
                </div>
                <h2 className="mt-5 text-[42px] font-extrabold leading-[0.96]">Everything ready<br />before arrival.</h2>
                <p className="mt-5 max-w-sm text-[14px] leading-relaxed text-white/75">One private account for reservations, verified payments, and time-released arrival details.</p>
                <div className="mt-7 space-y-3 text-[13px] font-semibold text-white/90">
                  <p className="flex items-center gap-3"><ShieldCheck size={18} className="text-[#FF385C]" /> Protected booking details</p>
                  <p className="flex items-center gap-3"><KeyRound size={18} className="text-[#FF385C]" /> Scheduled Door access</p>
                  <p className="flex items-center gap-3"><Check size={18} className="text-[#FF385C]" /> A team that stays reachable</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-xl sm:right-5 sm:top-5"
              style={{ background: c.CARD2, color: c.TEXT, border: `1px solid ${c.BORDER}` }}
              aria-label="Close account access"
              data-testid="auth-dialog-close"
            >
              <X size={20} />
            </button>

            <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
              <AuthSwitch
                className="mx-auto min-h-full max-w-[520px] px-5 pb-8 pt-20 sm:flex sm:flex-col sm:px-10 sm:py-14 lg:px-14"
                initialMode={initialMode}
                onAuthenticated={(_user, destination) => {
                  onClose();
                  navigate(returnTo || destination);
                }}
                testIdPrefix="auth-dialog"
              />
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
