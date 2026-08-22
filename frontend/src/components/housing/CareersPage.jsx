import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Building2, HeartHandshake, MapPin, MoveUpRight, Wrench } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { pageStyle } from "@/lib/designSystem";

const TEAMS = [
  ["01", "Operations", "Building partnerships, unit readiness, arrivals, and the daily details that keep every stay dependable.", Wrench],
  ["02", "Product & engineering", "The booking journey, private guest portal, access workflow, and internal tools that connect the operation.", Building2],
  ["03", "Guest experience", "Clear, human support before arrival, throughout the stay, and through checkout.", HeartHandshake],
];

const WAYS_OF_WORKING = [
  ["Own the complete outcome", "A task is not complete when it leaves one team. We follow the work until the guest or building partner has what they need."],
  ["Make complexity feel calm", "The operation can be detailed. The experience should not be. We organize information so the next action is always clear."],
  ["Protect trust by default", "Private access information and guest data are handled deliberately, with the minimum exposure necessary for each person’s role."],
  ["Stay close to the real stay", "We design around what happens at the building entrance, inside the apartment, and during an actual Philadelphia stay."],
];

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-12%" }, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } };

export default function CareersPage() {
  const { colors: c } = useTheme();

  return (
    <main style={pageStyle(c)}>
      <section className="relative min-h-[720px] overflow-hidden text-white md:min-h-[820px]" style={{ background: "#111111" }}>
        <img src="/images/operator-portfolio/broad-noble-sky-deck.webp" alt="Philadelphia skyline from a furnished apartment building" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
        <div className="eh-container relative flex min-h-[720px] flex-col justify-between py-12 md:min-h-[820px] md:py-16">
          <div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/70">Express Housing · Careers</p><p className="hidden items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55 sm:flex"><MapPin size={14} /> Philadelphia</p></div>
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }} className="max-w-[1050px] pb-6"><p className="text-[13px] font-bold text-white/65">Work on the whole stay.</p><h1 className="mt-5 text-[54px] font-extrabold leading-[0.87] tracking-[-0.06em] sm:text-[76px] md:text-[102px] lg:text-[118px]">Build furnished living that works.</h1><div className="mt-10 flex flex-col gap-6 border-t border-white/25 pt-7 md:flex-row md:items-end md:justify-between"><p className="max-w-2xl text-[17px] font-semibold leading-relaxed text-white/85 md:text-[21px]">Join a team connecting homes, buildings, technology, and human support into one dependable Philadelphia stay.</p><a href="#open-roles" className="inline-flex min-h-12 shrink-0 items-center gap-2 self-start rounded-full bg-white px-6 text-[13px] font-bold text-black">View opportunities <ArrowRight size={16} /></a></div></motion.div>
        </div>
      </section>

      <section className="eh-container py-20 md:py-32">
        <motion.div {...reveal} className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20"><div><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>The work</p><p className="mt-5 max-w-xs text-[13px] leading-relaxed" style={{ color: c.MUTED }}>A furnished-housing company is equal parts hospitality, operations, and product thinking.</p></div><div><h2 className="text-[40px] font-extrabold leading-[0.97] tracking-[-0.045em] md:text-[62px]">The reservation is only the beginning.</h2><div className="mt-9 grid gap-6 text-[15px] leading-relaxed md:grid-cols-2" style={{ color: c.MUTED }}><p>Guests need more than a place to book. They need the right home confirmed, their arrival coordinated, their private details protected, and a team that remains reachable.</p><p>Our work connects every part of that experience. We care about the system behind the stay and the calm, clear experience the guest sees in front of it.</p></div></div></motion.div>

        <div className="mt-24 border-t pt-16 md:mt-36 md:pt-24" style={{ borderColor: c.BORDER }}><motion.div {...reveal}><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>Where you can contribute</p><h2 className="mt-5 max-w-3xl text-[40px] font-extrabold leading-[0.97] tracking-[-0.045em] md:text-[62px]">Three disciplines.<br />One guest experience.</h2></motion.div><div className="mt-14 grid border-y md:grid-cols-3" style={{ borderColor: c.BORDER }}>{TEAMS.map(([number, title, text, Icon], index) => <motion.article key={number} {...reveal} transition={{ ...reveal.transition, delay: index * 0.08 }} className="border-b py-8 md:border-b-0 md:border-r md:px-8 md:py-10 md:first:pl-0 md:last:border-r-0" style={{ borderColor: c.BORDER }}><div className="flex items-center justify-between"><span className="text-[11px] font-bold" style={{ color: c.BLUE }}>{number}</span><Icon size={24} strokeWidth={1.5} color={c.BLUE} /></div><h3 className="mt-12 text-[25px] font-extrabold leading-tight">{title}</h3><p className="mt-5 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{text}</p></motion.article>)}</div></div>
      </section>

      <section className="grid min-h-[620px] md:grid-cols-2">
        <div className="relative min-h-[440px] overflow-hidden"><img src="/images/operator-portfolio/broad-noble-study-lounge.webp" alt="A shared lounge and workspace" className="absolute inset-0 h-full w-full object-cover" /><p className="absolute bottom-6 left-6 rounded-full bg-black/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white">Spaces designed for real life</p></div>
        <div className="flex items-center p-8 md:p-14 lg:p-20" style={{ background: c.CARD2 }}><motion.div {...reveal}><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>How we work</p><h2 className="mt-6 text-[38px] font-extrabold leading-[0.98] tracking-[-0.04em] md:text-[54px]">Small team.<br />Complete ownership.</h2><p className="mt-7 max-w-xl text-[14px] leading-relaxed" style={{ color: c.MUTED }}>The person closest to a problem should have the context and agency to move it forward. That means fewer handoffs and more responsibility for the complete result.</p></motion.div></div>
      </section>

      <section className="eh-container py-20 md:py-32"><motion.div {...reveal} className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20"><div><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>Our standards</p><h2 className="mt-5 text-[34px] font-extrabold leading-[1] tracking-[-0.035em]">What good work looks like here.</h2></div><div className="border-t" style={{ borderColor: c.BORDER }}>{WAYS_OF_WORKING.map(([title, text], index) => <article key={title} className="grid gap-3 border-b py-7 sm:grid-cols-[44px_0.8fr_1.2fr] sm:gap-6" style={{ borderColor: c.BORDER }}><span className="text-[11px] font-bold" style={{ color: c.BLUE }}>{String(index + 1).padStart(2, "0")}</span><h3 className="text-[17px] font-extrabold">{title}</h3><p className="text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{text}</p></article>)}</div></motion.div></section>

      <section id="open-roles" className="scroll-mt-24 py-20 text-white md:py-28" style={{ background: "#171717" }}><div className="eh-container"><motion.div {...reveal} className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "#6597FF" }}>Open roles</p><h2 className="mt-6 max-w-3xl text-[45px] font-extrabold leading-[0.94] tracking-[-0.05em] md:text-[70px]">Nothing posted today.<br />The door is still open.</h2></div><div><p className="max-w-lg text-[14px] leading-relaxed text-white/60">If you care about hospitality, housing operations, or building thoughtful systems around real-world stays, tell us what you would want to work on. We will keep your note for a relevant future opening.</p><Link to="/contact" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-[13px] font-bold text-white" style={{ background: c.BLUE }}>Introduce yourself <MoveUpRight size={16} /></Link></div></motion.div></div></section>
    </main>
  );
}
