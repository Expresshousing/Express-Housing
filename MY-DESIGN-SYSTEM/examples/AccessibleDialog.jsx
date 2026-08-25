import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const selector = "button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])";

export default function AccessibleDialog({ open, onClose, title = "Review details", children }) {
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => dialogRef.current?.querySelector(selector)?.focus(), 0);
    const onKey = (event) => {
      if (event.key === "Escape") return onClose();
      if (event.key !== "Tab") return;
      const items = [...(dialogRef.current?.querySelectorAll(selector) || [])];
      if (!items.length) return;
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
      if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.clearTimeout(timer); window.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; previousFocus.current?.focus?.(); };
  }, [onClose, open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="example-dialog-title" className="relative h-[100dvh] w-full overflow-y-auto border border-[#ebebeb] bg-white p-5 text-[#222] sm:h-auto sm:max-h-[calc(100dvh-48px)] sm:max-w-[720px] sm:rounded-[20px] sm:p-8">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#ebebeb] bg-[#f7f7f7]" aria-label="Close dialog"><X size={20} /></button>
        <h2 id="example-dialog-title" className="pr-14 text-[34px] font-extrabold leading-none">{title}</h2>
        <div className="mt-7">{children}</div>
      </section>
    </div>, document.body,
  );
}

