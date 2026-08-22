import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Check, KeyRound, ShieldCheck } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { pageStyle } from "@/lib/designSystem";

const PRINCIPLES = [
  ["01", "Clarity before commitment", "Dates, rates, policies, and what happens next are presented before a payment step."],
  ["02", "A real home, verified carefully", "Every listing represents managed inventory. The assigned unit and its exact details are confirmed for the approved stay."],
  ["03", "Private details stay private", "Unit numbers, access instructions, door codes, and Wi-Fi are released only through the authenticated guest portal."],
  ["04", "One accountable team", "Reservation and arrival updates come directly from Express Housing, with one clear place to find the stay."],
];

const JOURNEY = [
  { label: "Choose", title: "Start with the neighborhood and home type.", text: "Compare a focused Philadelphia collection without sorting through hundreds of disconnected listings." },
  { label: "Confirm", title: "Review the complete stay before payment.", text: "The assigned home, dates, pricing, policies, and any parking request are reviewed before the stay moves forward." },
  { label: "Arrive", title: "Find every private detail in one place.", text: "Your secure portal brings together entry instructions, access video, Wi-Fi, building guidance, support, and checkout." },
];

const BUILDINGS = ["Broad + Noble", "The Hannah", "Edgewater II", "1500 Locust"];

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-12%" }, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } };

export default function AboutPage() {
  const { colors: c } = useTheme();

  return (
    <main style={pageStyle(c)}>
      <section className="eh-container pb-16 pt-12 md:pb-24 md:pt-20">
        <div className="flex items-center gap-4"><span className="h-0.5 w-10" style={{ background: c.BLUE }} aria-hidden="true" /><p className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: c.BLUE }}>About Express Housing</p></div>
        <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }} className="mt-9 max-w-[1100px] text-[52px] font-extrabold leading-[0.88] tracking-[-0.055em] sm:text-[72px] md:text-[96px] lg:text-[118px]">
          A furnished stay should feel handled.
        </motion.h1>
        <div className="mt-12 grid gap-8 border-t pt-8 md:grid-cols-[1fr_0.7fr] md:items-start" style={{ borderColor: c.BORDER }}>
          <p className="max-w-2xl text-[20px] font-bold leading-[1.25] md:text-[28px]">We bring the home, reservation, arrival, and support into one clear Philadelphia experience.</p>
          <p className="max-w-xl text-[14px] leading-relaxed" style={{ color: c.MUTED }}>Express Housing manages furnished stays for business travel, medical visits, family transitions, and relocation. The goal is simple: fewer handoffs, fewer unanswered questions, and one reliable place to understand the stay.</p>
        </div>
      </section>

      <section className="grid h-[68vh] min-h-[520px] max-h-[820px] grid-cols-1 overflow-hidden md:grid-cols-[1.45fr_0.55fr]" aria-label="Express Housing interiors">
        <div className="relative overflow-hidden"><img src="/images/operator-portfolio/broad-noble-lobby.jpg" alt="A furnished lobby and resident lounge" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" /><p className="absolute bottom-6 left-6 max-w-sm text-[11px] font-bold uppercase tracking-[0.18em] text-white/75 md:bottom-9 md:left-9">Philadelphia · Furnished living</p></div>
        <div className="hidden grid-rows-2 md:grid"><img src="/images/operator-portfolio/broad-noble-kitchen.jpg" alt="A furnished model kitchen" className="h-full w-full object-cover" /><img src="/images/operator-portfolio/center-city-rooftop.webp" alt="A Philadelphia rooftop view" className="h-full w-full object-cover" /></div>
      </section>

      <section className="eh-container py-20 md:py-32">
        <motion.div {...reveal} className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>Why we started</p><p className="mt-5 max-w-xs text-[13px] leading-relaxed" style={{ color: c.MUTED }}>The booking is only one part of the stay. The operational details around it matter just as much.</p></div>
          <div><h2 className="text-[38px] font-extrabold leading-[0.98] tracking-[-0.04em] md:text-[58px]">Relocation should not run on spreadsheets and forwarded emails.</h2><div className="mt-9 grid gap-6 text-[15px] leading-relaxed md:grid-cols-2" style={{ color: c.MUTED }}><p>Too often, the search lives on one website, the reservation in an email thread, and arrival instructions in a last-minute message. No one place explains what is confirmed.</p><p>Express Housing replaces that fragmentation with a guided flow—from choosing a building to receiving protected arrival details—supported by a team that remains connected to the stay.</p></div></div>
        </motion.div>

        <div className="mt-24 border-t pt-16 md:mt-36 md:pt-24" style={{ borderColor: c.BORDER }}>
          <motion.div {...reveal} className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>Our operating principles</p><h2 className="mt-5 max-w-3xl text-[38px] font-extrabold leading-[0.98] tracking-[-0.04em] md:text-[58px]">The details that make a stay feel dependable.</h2></div><ShieldCheck size={40} strokeWidth={1.4} color={c.BLUE} /></motion.div>
          <div className="mt-14 border-b" style={{ borderColor: c.BORDER }}>{PRINCIPLES.map(([number, title, text], index) => <motion.article key={number} {...reveal} transition={{ ...reveal.transition, delay: index * 0.04 }} className="grid gap-4 border-t py-8 md:grid-cols-[80px_0.8fr_1.2fr] md:items-start md:gap-8 md:py-10" style={{ borderColor: c.BORDER }}><span className="text-[12px] font-bold" style={{ color: c.BLUE }}>{number}</span><h3 className="text-[22px] font-extrabold leading-tight">{title}</h3><p className="max-w-xl text-[14px] leading-relaxed" style={{ color: c.MUTED }}>{text}</p></motion.article>)}</div>
        </div>
      </section>

      <section className="py-20 text-white md:py-28" style={{ background: "#171717" }}>
        <div className="eh-container"><motion.div {...reveal}><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "#6597FF" }}>One connected journey</p><h2 className="mt-5 max-w-3xl text-[42px] font-extrabold leading-[0.96] tracking-[-0.04em] md:text-[64px]">From first look to front door.</h2></motion.div><div className="mt-16 grid border-y border-white/15 md:grid-cols-3">{JOURNEY.map((item, index) => <motion.article key={item.label} {...reveal} transition={{ ...reveal.transition, delay: index * 0.08 }} className="border-b border-white/15 py-8 md:border-b-0 md:border-r md:px-8 md:py-10 md:first:pl-0 md:last:border-r-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Chapter {String(index + 1).padStart(2, "0")} · {item.label}</p><h3 className="mt-7 text-[25px] font-extrabold leading-[1.05]">{item.title}</h3><p className="mt-5 text-[13px] leading-relaxed text-white/55">{item.text}</p></motion.article>)}</div></div>
      </section>

      <section className="eh-container py-20 md:py-32">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-end"><motion.div {...reveal}><div className="flex items-center gap-3"><Building2 size={20} color={c.BLUE} /><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>Philadelphia collection</p></div><h2 className="mt-6 max-w-xl text-[42px] font-extrabold leading-[0.96] tracking-[-0.04em] md:text-[64px]">Four buildings.<br />One clear standard.</h2></motion.div><motion.div {...reveal} className="border-t" style={{ borderColor: c.BORDER }}>{BUILDINGS.map((building) => <div key={building} className="flex items-center gap-3 border-b py-4 text-[15px] font-bold" style={{ borderColor: c.BORDER }}><Check size={16} color={c.BLUE} /> {building}</div>)}</motion.div></div>
        <p className="mt-8 max-w-2xl text-[12px] leading-relaxed" style={{ color: c.MUTED }}>Listings use authorized building, amenity, or model-home photography. Exact unit layout, furniture, view, and finishes are confirmed for the assigned home.</p>

        <motion.div {...reveal} className="mt-20 grid overflow-hidden rounded-[22px] md:grid-cols-[1fr_auto]" style={{ background: c.TEXT, color: c.BG }}><div className="p-8 md:p-12"><div className="flex items-center gap-3"><KeyRound size={20} /><p className="text-[10px] font-bold uppercase tracking-[0.2em]">Ready when you are</p></div><h2 className="mt-5 max-w-2xl text-[34px] font-extrabold leading-[0.98] tracking-[-0.035em] md:text-[50px]">Find the Philadelphia home that fits your stay.</h2></div><div className="flex items-end p-8 pt-0 md:p-12"><Link to="/#stay-planner" className="inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-[14px] font-bold text-white" style={{ background: c.BLUE }}>View available homes <ArrowRight size={16} /></Link></div></motion.div>
      </section>
    </main>
  );
}
