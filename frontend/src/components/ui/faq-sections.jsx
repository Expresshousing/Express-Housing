import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Search, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

const EASE = [0.22, 1, 0.36, 1];

export default function FAQSections({ categories, imageSrc, imageAlt, title = "Answers for a smoother stay.", description }) {
  const { colors: c } = useTheme();
  const reduceMotion = useReducedMotion();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.label || "");
  const [openIndex, setOpenIndex] = useState(0);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const currentCategory = categories.find((category) => category.label === activeCategory) || categories[0];
  const searchResults = useMemo(() => categories.flatMap((category) => category.items.map((item) => ({ ...item, category: category.label }))).filter((item) => !normalizedQuery || `${item.question} ${item.answer} ${item.category}`.toLowerCase().includes(normalizedQuery)), [categories, normalizedQuery]);
  const visibleItems = normalizedQuery ? searchResults : currentCategory?.items || [];

  useEffect(() => { setOpenIndex(0); }, [activeCategory, normalizedQuery]);

  return (
    <section aria-labelledby="faq-heading">
      <div className="grid gap-10 pb-14 pt-10 md:pb-20 md:pt-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div><div className="flex items-center gap-4"><span className="h-0.5 w-10" style={{ background: c.BLUE }} aria-hidden="true" /><p className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: c.BLUE }}>Frequently asked questions</p></div><motion.h1 id="faq-heading" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mt-8 max-w-4xl text-[52px] font-extrabold leading-[0.9] tracking-[-0.055em] sm:text-[70px] md:text-[88px]">{title}</motion.h1><p className="mt-7 max-w-2xl text-[16px] leading-relaxed md:text-[18px]" style={{ color: c.MUTED }}>{description}</p></div>
        <div className="relative h-[280px] overflow-hidden rounded-[20px] md:h-[360px]"><img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" /><p className="absolute bottom-5 left-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Philadelphia · Guest guidance</p></div>
      </div>

      <div className="border-y py-6" style={{ borderColor: c.BORDER }}><label className="relative block"><Search size={20} className="absolute left-0 top-1/2 -translate-y-1/2" style={{ color: c.BLUE }} /><span className="sr-only">Search frequently asked questions</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full border-0 bg-transparent py-4 pl-10 pr-4 text-[18px] font-bold outline-none placeholder:font-medium md:text-[22px]" style={{ color: c.TEXT }} placeholder="Search booking, access, pricing, parking…" /></label></div>

      <div className="grid gap-12 py-16 md:py-24 lg:grid-cols-[260px_1fr] lg:gap-20">
        <aside className="lg:sticky lg:top-28 lg:self-start"><p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: c.MUTED }}>{normalizedQuery ? `${searchResults.length} search result${searchResults.length === 1 ? "" : "s"}` : "Browse by topic"}</p>{!normalizedQuery && <nav className="mt-5 border-t" style={{ borderColor: c.BORDER }} aria-label="FAQ categories">{categories.map((category, index) => { const selected = category.label === activeCategory; return <button key={category.label} type="button" onClick={() => setActiveCategory(category.label)} className="flex min-h-14 w-full items-center justify-between border-b text-left text-[14px] font-bold" style={{ borderColor: c.BORDER, color: selected ? c.BLUE : c.MUTED }} aria-pressed={selected}><span>{category.label}</span><span className="text-[10px] opacity-60">{String(index + 1).padStart(2, "0")}</span></button>; })}</nav>}<div className="mt-8 flex items-start gap-3 rounded-2xl p-4" style={{ background: `${c.BLUE}0D` }}><ShieldCheck size={18} className="mt-0.5 shrink-0" color={c.BLUE} /><p className="text-[11px] leading-relaxed" style={{ color: c.MUTED }}>Private unit numbers, codes, Wi-Fi, and arrival instructions appear only in an authorized guest account.</p></div></aside>

        <div aria-live="polite">
          {!normalizedQuery && <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: c.BLUE }}>Topic</p><h2 className="mt-3 text-[34px] font-extrabold leading-none md:text-[44px]">{currentCategory?.label}</h2></div><span className="text-[12px] font-bold" style={{ color: c.MUTED }}>{visibleItems.length} questions</span></div>}
          {visibleItems.length === 0 ? <div className="border-y py-16" style={{ borderColor: c.BORDER }}><h2 className="text-[24px] font-extrabold">No answer found</h2><p className="mt-3 text-[14px]" style={{ color: c.MUTED }}>Try a shorter search, browse a topic, or contact the Express Housing team below.</p></div> : <div className="border-t" style={{ borderColor: c.BORDER }}>{visibleItems.map((faq, index) => { const isOpen = openIndex === index; const answerId = `faq-answer-${index}`; return <article key={`${faq.category || activeCategory}-${faq.question}`} className="border-b" style={{ borderColor: c.BORDER }}><button type="button" className="flex min-h-[88px] w-full items-center justify-between gap-6 py-5 text-left" onClick={() => setOpenIndex(isOpen ? -1 : index)} aria-expanded={isOpen} aria-controls={answerId}><span><span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: c.BLUE }}>{normalizedQuery ? faq.category : `${String(index + 1).padStart(2, "0")}`}</span><span className="mt-2 block text-[17px] font-extrabold leading-snug md:text-[21px]">{faq.question}</span></span><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: isOpen ? c.BLUE : c.BORDER, color: isOpen ? c.BLUE : c.MUTED }} aria-hidden="true"><ChevronDown size={18} className={cn("transition-transform", isOpen && "rotate-180")} /></span></button><AnimatePresence initial={false}>{isOpen && <motion.div id={answerId} initial={reduceMotion ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reduceMotion ? { display: "none" } : { height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }} className="overflow-hidden"><p className="max-w-3xl pb-8 pr-14 text-[15px] leading-7" style={{ color: c.MUTED }}>{faq.answer}</p></motion.div>}</AnimatePresence></article>; })}</div>}
        </div>
      </div>
    </section>
  );
}
