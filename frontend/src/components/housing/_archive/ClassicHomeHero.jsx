// Archived 2026-08-20: this was the homepage hero (image slideshow + headline
// + Airbnb-style Where/When/Who search bar) before it was replaced by the
// cinematic scroll-triggered video tour (see
// components/ui/scroll-triggered-video-hero.jsx). Kept here, unused, so it
// can be dropped back in on request.
//
// To restore: import ClassicHomeHero from this file into HomePage.jsx and
// render `<ClassicHomeHero neighborhoods={neighborhoods} />` in place of the
// video hero section.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, ChevronLeft, ChevronRight, Minus, MapPin, Plus, Search, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { todayISO } from "@/lib/date";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle } from "@/lib/designSystem";

const HERO_SLIDES = [
  { src: "/images/operator-portfolio/broad-noble-kitchen.jpg", label: "Broad + Noble · Furnished model kitchen", position: "center 58%" },
  { src: "/images/operator-portfolio/broad-noble-private-terrace.jpg", label: "Broad + Noble · Private terrace", position: "center 52%" },
  { src: "/images/operator-portfolio/center-city-rooftop.webp", label: "1500 Locust · Center City rooftop view", position: "center 43%" },
  { src: "/images/operator-portfolio/broad-noble-lobby.jpg", label: "Broad + Noble · Resident lobby", position: "center 58%" },
  { src: "/images/operator-portfolio/the-hannah-entrance.jpg", label: "The Hannah · Callowhill entrance", position: "center center" },
];

const HERO_SLIDE_INTERVAL = 6500;

const isoLocal = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseISO = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const monthCells = (year, monthIndex) => {
  const startWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return [...Array(startWeekday).fill(null), ...Array(daysInMonth)].map((_, i) => (i < startWeekday ? null : new Date(year, monthIndex, i - startWeekday + 1)));
};
const shortLabel = (iso) => parseISO(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function MonthGrid({ year, monthIndex, todayIso, checkIn, checkOut, onPick, c }) {
  const cells = monthCells(year, monthIndex);
  const monthLabel = new Date(year, monthIndex, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  return (
    <div className="w-full">
      <p className="mb-3 text-center text-[14px] font-bold" style={{ color: c.TEXT }}>{monthLabel}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold" style={{ color: c.MUTED }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const iso = isoLocal(date);
          const isPast = iso < todayIso;
          const isCheckIn = iso === checkIn;
          const isCheckOut = iso === checkOut;
          const inRange = checkIn && checkOut && iso > checkIn && iso < checkOut;
          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onClick={() => onPick(iso)}
              className="relative flex h-9 w-9 items-center justify-center justify-self-center rounded-full text-[13px] font-semibold disabled:cursor-not-allowed"
              style={
                isCheckIn || isCheckOut
                  ? { background: c.BLUE, color: "#FFFFFF" }
                  : inRange
                  ? { background: `${c.BLUE}18`, color: c.TEXT, borderRadius: 0 }
                  : { color: isPast ? c.BORDER : c.TEXT }
              }
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchBar({ neighborhoods }) {
  const { colors: c, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [where, setWhere] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestsCount, setGuestsCount] = useState(0);
  const [openField, setOpenField] = useState(null); // "where" | "when" | "who" | null
  const [popoverStyle, setPopoverStyle] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const today = todayISO();

  const barRef = useRef(null);
  const whereRef = useRef(null);
  const whenRef = useRef(null);
  const whoRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!openField) return;
    const anchor = (openField === "where" ? whereRef : openField === "when" ? whenRef : whoRef).current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const widths = { where: 280, when: 640, who: 300 };
    const width = Math.min(widths[openField], window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    // Anchored from the viewport bottom rather than the trigger's bottom edge,
    // so the popover grows upward from just above the search bar instead of
    // downward past the visible viewport (it was getting cut off below).
    const bottom = window.innerHeight - rect.top + 10;
    setPopoverStyle({ bottom, left, width, maxHeight: rect.top - 24 });
  }, [openField]);

  useEffect(() => {
    if (!openField) return;
    const closeOnOutsideClick = (event) => {
      if (barRef.current?.contains(event.target) || popoverRef.current?.contains(event.target)) return;
      setOpenField(null);
    };
    const closeOnScroll = () => setOpenField(null);
    document.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("scroll", closeOnScroll, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("scroll", closeOnScroll, true);
    };
  }, [openField]);

  const pickDate = (iso) => {
    if (!checkIn || (checkIn && checkOut)) { setCheckIn(iso); setCheckOut(""); return; }
    if (iso <= checkIn) { setCheckIn(iso); setCheckOut(""); return; }
    setCheckOut(iso);
    setOpenField(null);
  };

  const shiftMonth = (delta) => setVisibleMonth(({ y, m }) => { const d = new Date(y, m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  const submit = (event) => {
    event.preventDefault();
    if (Boolean(checkIn) !== Boolean(checkOut)) { toast.error("Choose both check-in and check-out, or leave both dates empty"); return; }
    if (checkIn && checkOut <= checkIn) { toast.error("Check-out must be after check-in"); return; }
    const params = new URLSearchParams();
    if (where) params.set("neighborhood", where);
    if (guestsCount > 0) params.set("guests", String(guestsCount));
    if (checkIn) params.set("check_in", checkIn);
    if (checkOut) params.set("check_out", checkOut);
    navigate(`/?${params.toString()}#stay-planner`);
  };

  const segmentStyle = (field) => ({
    background: openField === field ? `${c.BLUE}0F` : "transparent",
  });

  const whenLabel = checkIn && checkOut ? `${shortLabel(checkIn)} – ${shortLabel(checkOut)}` : checkIn ? `${shortLabel(checkIn)} – Add checkout` : "Add dates";
  const whoLabel = guestsCount > 0 ? `${guestsCount} guest${guestsCount === 1 ? "" : "s"}` : "Add guests";

  return (
    <form ref={barRef} onSubmit={submit} className="hero-search-form relative flex w-full flex-col gap-2 rounded-3xl p-2 md:w-auto md:flex-row md:items-center md:rounded-full md:p-2" style={cardStyle(c, isDarkMode, { radius: 24, padding: 0 })} data-testid="home-search-bar">
      <button
        ref={whereRef}
        type="button"
        onClick={() => setOpenField(openField === "where" ? null : "where")}
        className="flex min-h-12 items-center gap-3 rounded-full px-5 py-3 text-left transition-colors md:min-w-[260px] md:px-7 md:py-3.5"
        style={segmentStyle("where")}
        data-testid="search-neighborhood"
      >
        <MapPin size={16} style={{ color: c.MUTED }} />
        <span className="min-w-0">
          <span className="block text-[11px] font-bold" style={{ color: c.TEXT }}>Where</span>
          <span className="block truncate text-[13px]" style={{ color: where ? c.TEXT : c.MUTED }}>{where || "All Philadelphia"}</span>
        </span>
      </button>

      <div className="hidden h-8 w-px md:block" style={{ background: c.BORDER }} />

      <button
        ref={whenRef}
        type="button"
        onClick={() => setOpenField(openField === "when" ? null : "when")}
        className="flex min-h-12 items-center gap-3 rounded-full px-5 py-3 text-left transition-colors md:min-w-[260px] md:px-7 md:py-3.5"
        style={segmentStyle("when")}
      >
        <CalendarCheck size={16} style={{ color: c.MUTED }} />
        <span className="min-w-0">
          <span className="block text-[11px] font-bold" style={{ color: c.TEXT }}>When</span>
          <span className="block truncate text-[13px]" style={{ color: checkIn ? c.TEXT : c.MUTED }}>{whenLabel}</span>
        </span>
      </button>

      <div className="hidden h-8 w-px md:block" style={{ background: c.BORDER }} />

      <button
        ref={whoRef}
        type="button"
        onClick={() => setOpenField(openField === "who" ? null : "who")}
        className="flex min-h-12 items-center gap-3 rounded-full px-5 py-3 text-left transition-colors md:min-w-[260px] md:px-7 md:py-3.5"
        style={segmentStyle("who")}
        data-testid="search-guests"
      >
        <UsersRound size={16} style={{ color: c.MUTED }} />
        <span className="min-w-0">
          <span className="block text-[11px] font-bold" style={{ color: c.TEXT }}>Who</span>
          <span className="block truncate text-[13px]" style={{ color: guestsCount > 0 ? c.TEXT : c.MUTED }}>{whoLabel}</span>
        </span>
      </button>

      <button type="submit" className="flex h-14 w-full items-center justify-center gap-2 rounded-full text-[15px] font-bold text-white md:h-14 md:w-14 md:shrink-0" style={{ background: c.BLUE, boxShadow: `0 8px 24px ${c.BLUE}40` }} data-testid="search-submit" aria-label="Search">
        <Search size={20} />
        <span className="md:hidden">Search</span>
      </button>

      {openField && popoverStyle && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[80] overflow-y-auto rounded-3xl p-5"
          style={{ ...popoverStyle, background: c.CARD, border: `1px solid ${c.BORDER}`, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
        >
          {openField === "where" && (
            <div className="max-h-80 overflow-y-auto">
              <button type="button" onClick={() => { setWhere(""); setOpenField(null); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[13px] font-semibold" style={{ background: where === "" ? c.CARD2 : "transparent", color: c.TEXT }}>All Philadelphia</button>
              {neighborhoods.map((item) => (
                <button key={item.name} type="button" onClick={() => { setWhere(item.name); setOpenField(null); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[13px] font-semibold" style={{ background: where === item.name ? c.CARD2 : "transparent", color: c.TEXT }}>{item.name}</button>
              ))}
            </div>
          )}

          {openField === "when" && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => shiftMonth(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: c.BORDER, color: c.TEXT }} aria-label="Previous month"><ChevronLeft size={15} /></button>
                <button type="button" onClick={() => shiftMonth(1)} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: c.BORDER, color: c.TEXT }} aria-label="Next month"><ChevronRight size={15} /></button>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <MonthGrid year={visibleMonth.y} monthIndex={visibleMonth.m} todayIso={today} checkIn={checkIn} checkOut={checkOut} onPick={pickDate} c={c} />
                <div className="hidden md:block">
                  <MonthGrid year={visibleMonth.m === 11 ? visibleMonth.y + 1 : visibleMonth.y} monthIndex={(visibleMonth.m + 1) % 12} todayIso={today} checkIn={checkIn} checkOut={checkOut} onPick={pickDate} c={c} />
                </div>
              </div>
              {checkIn && (
                <button type="button" onClick={() => { setCheckIn(""); setCheckOut(""); }} className="mt-3 text-[12px] font-bold underline" style={{ color: c.MUTED }}>Clear dates</button>
              )}
            </div>
          )}

          {openField === "who" && (
            <div className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-[14px] font-bold" style={{ color: c.TEXT }}>Guests</span>
                <span className="block text-[12px]" style={{ color: c.MUTED }}>How many people are staying?</span>
              </span>
              <span className="flex items-center gap-3">
                <button type="button" onClick={() => setGuestsCount((n) => Math.max(0, n - 1))} disabled={guestsCount === 0} className="flex h-9 w-9 items-center justify-center rounded-full border disabled:opacity-30" style={{ borderColor: c.BORDER, color: c.TEXT }} aria-label="Decrease guests"><Minus size={14} /></button>
                <span className="w-5 text-center text-[14px] font-bold" style={{ color: c.TEXT }}>{guestsCount || "Any"}</span>
                <button type="button" onClick={() => setGuestsCount((n) => Math.min(12, n + 1))} className="flex h-9 w-9 items-center justify-center rounded-full border" style={{ borderColor: c.BORDER, color: c.TEXT }} aria-label="Increase guests"><Plus size={14} /></button>
              </span>
            </div>
          )}
        </div>,
        document.body
      )}
    </form>
  );
}

export default function ClassicHomeHero({ neighborhoods }) {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return undefined;
    const timer = window.setInterval(() => setActiveHeroSlide((current) => (current + 1) % HERO_SLIDES.length), HERO_SLIDE_INTERVAL);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative left-1/2 w-[100dvw] max-w-none -translate-x-1/2 min-h-[max(780px,100svh)] overflow-hidden md:min-h-[max(660px,100svh)]" style={{ background: "#0A0A0A", color: "#FFFFFF" }} aria-label="Express Housing furnished apartment portfolio">
      <div className="absolute inset-0" aria-hidden="true">
        {HERO_SLIDES.map((slide, index) => <img key={slide.src} src={slide.src} alt="" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${index === activeHeroSlide ? "opacity-100 hero-slide-active" : "opacity-0"}`} style={{ objectPosition: slide.position, transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }} />)}
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(10,10,10,0.86) 0%, rgba(10,10,10,0.58) 52%, rgba(10,10,10,0.20) 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(10,10,10,0.58) 0%, transparent 48%)" }} />
      </div>

      <div className="eh-container relative z-10 flex min-h-[max(780px,100svh)] flex-col justify-start pb-16 pt-32 md:min-h-[max(660px,100svh)] md:justify-center md:py-28">
        <div className="max-w-4xl">
          <h1 className="text-[40px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[52px] md:text-[64px]" data-testid="hero-headline">Furnished living.<br />Made effortless.</h1>
          <p className="mt-6 max-w-2xl text-[17px] font-medium leading-relaxed md:text-[20px]" style={{ color: "rgba(255,255,255,0.84)" }}>Professionally managed apartments for business travel, medical stays, relocation, and extended living.</p>
        </div>
        <div className="mt-10 flex w-full justify-start md:mt-14 md:justify-center">
          <SearchBar neighborhoods={neighborhoods} />
        </div>
      </div>
    </section>
  );
}
