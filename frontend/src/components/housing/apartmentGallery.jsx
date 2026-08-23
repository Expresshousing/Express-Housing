import React, { useCallback, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { adjacentImageIndex, swipeDirection } from "./apartmentGalleryUtils";

export default function ApartmentGallery({ images = [], index, onIndexChange, open, onOpenChange, title }) {
  const swipeStart = useRef(null);
  const closeButtonRef = useRef(null);
  const imageCount = images.length;

  const move = useCallback((direction) => {
    if (imageCount > 1) onIndexChange(adjacentImageIndex(index, direction, imageCount));
  }, [imageCount, index, onIndexChange]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move, open]);

  if (!imageCount) return null;

  const imageAlt = `${title} — photo ${index + 1} of ${imageCount}`;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content
          className="fixed inset-0 z-[101] flex h-[100dvh] w-[100dvw] flex-col overflow-hidden bg-[#090909] text-white outline-none"
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => { event.preventDefault(); closeButtonRef.current?.focus(); }}
        >
          <Dialog.Title className="sr-only">Photo gallery for {title}</Dialog.Title>

          <header
            className="relative z-20 flex min-h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6"
            style={{ paddingTop: "env(safe-area-inset-top)", paddingLeft: "max(1rem, env(safe-area-inset-left))", paddingRight: "max(1rem, env(safe-area-inset-right))" }}
          >
            <div>
              <p className="max-w-[65vw] truncate text-sm font-semibold sm:text-base">{title}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="min-w-12 text-center text-sm tabular-nums text-white/70" aria-live="polite">{index + 1} / {imageCount}</span>
              <Dialog.Close
                ref={closeButtonRef}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Close photo gallery"
              ><X size={22} /></Dialog.Close>
            </div>
          </header>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-4 sm:px-20 sm:py-6"
            style={{ touchAction: "pan-y", paddingLeft: "max(0.75rem, env(safe-area-inset-left))", paddingRight: "max(0.75rem, env(safe-area-inset-right))" }}
            onPointerDown={(event) => { if (event.isPrimary) swipeStart.current = { x: event.clientX, y: event.clientY }; }}
            onPointerUp={(event) => {
              if (!event.isPrimary) return;
              const direction = swipeDirection(swipeStart.current, { x: event.clientX, y: event.clientY });
              swipeStart.current = null;
              if (direction) move(direction);
            }}
            onPointerCancel={() => { swipeStart.current = null; }}
            onClick={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}
          >
            <img
              key={images[index]}
              src={images[index]}
              alt={imageAlt}
              draggable="false"
              className="max-h-full max-w-full select-none object-contain"
            />

            {imageCount > 1 && (
              <>
                <button type="button" onClick={() => move(-1)} className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6" aria-label="Previous photo"><ChevronLeft size={25} /></button>
                <button type="button" onClick={() => move(1)} className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6" aria-label="Next photo"><ChevronRight size={25} /></button>
              </>
            )}
          </div>

          {imageCount > 1 && (
            <nav className="hidden shrink-0 justify-center gap-2 overflow-x-auto border-t border-white/10 px-6 py-3 sm:flex" aria-label="Choose a photo" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
              {images.map((image, thumbnailIndex) => (
                <button key={`${image}-${thumbnailIndex}`} type="button" onClick={() => onIndexChange(thumbnailIndex)} className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" style={{ borderColor: thumbnailIndex === index ? "#FFFFFF" : "transparent", opacity: thumbnailIndex === index ? 1 : 0.55 }} aria-label={`Show photo ${thumbnailIndex + 1}`} aria-current={thumbnailIndex === index ? "true" : undefined}>
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </nav>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
