import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, HeartPulse, Quote, ShieldCheck, Users } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { pageStyle } from "@/lib/designSystem";

const STORIES = [
  {
    quote: "Our clinical staff rotate through Philadelphia on short notice. Having one team confirm the building, the dates, and the access details—instead of three separate emails—is the whole reason we kept using it.",
    voice: "Traveling nurse coordinator",
    context: "Healthcare staffing · Callowhill stays",
    category: "Medical travel",
  },
  {
    quote: "I relocated for a six-month assignment and didn't want a hotel or a full lease. The arrival page had my unit number and Door access ready before I landed—nothing to chase down at 9pm.",
    voice: "Corporate relocation, six-month stay",
    context: "Broad + Noble · Callowhill",
    category: "Relocation",
  },
  {
    quote: "We book furnished housing for new hires moving to Philadelphia every quarter. Express Housing is the first option we've used where the quote before payment actually matches the final invoice.",
    voice: "People operations lead",
    context: "Corporate housing program",
    category: "Business travel",
  },
  {
    quote: "My father needed to be close to the hospital for three weeks. The building was quiet, the kitchen meant we weren't eating out for every meal, and everything about entry was explained clearly in advance.",
    voice: "Family caregiver stay",
    context: "1500 Locust · Rittenhouse Square",
    category: "Family stay",
  },
  {
    quote: "Extended business travel usually means a soulless corporate suite. This felt like an actual apartment—and support answered the same day when our dates needed to shift.",
    voice: "Extended business traveler",
    context: "The Hannah · Callowhill",
    category: "Business travel",
  },
  {
    quote: "What sold us wasn't the apartment—it was that unit numbers and Wi-Fi stay private until the stay is actually confirmed. For a company booking on behalf of employees, that's the right default.",
    voice: "Travel and mobility manager",
    context: "Multi-stay corporate account",
    category: "Managed travel",
  },
];

const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-12%" }, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } };

export default function TestimonialsPage() {
  const { colors: c } = useTheme();
  const [featured, ...remaining] = STORIES;

  return (
    <main style={pageStyle(c)}>
      <section className="eh-container pb-16 pt-12 md:pb-24 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div><div className="flex items-center gap-4"><span className="h-0.5 w-10" style={{ background: c.BLUE }} aria-hidden="true" /><p className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: c.BLUE }}>Guest and client stories</p></div><motion.h1 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }} className="mt-9 max-w-4xl text-[54px] font-extrabold leading-[0.88] tracking-[-0.06em] sm:text-[74px] md:text-[94px]">The stay behind the story.</motion.h1></div>
          <div><p className="text-[19px] font-bold leading-[1.3]">What matters is not only where someone stays. It is how clearly the entire stay is handled.</p><div className="mt-6 flex items-start gap-3 border-t pt-5" style={{ borderColor: c.BORDER }}><ShieldCheck size={18} className="mt-0.5 shrink-0" color={c.BLUE} /><p className="text-[11px] leading-relaxed" style={{ color: c.MUTED }}><strong>Transparency note:</strong> these are illustrative, representative stories for the stay types Express Housing supports—not published, independently verified customer reviews. Real reviews should be added only with consent and source records.</p></div></div>
        </div>
      </section>

      <section className="grid min-h-[680px] md:grid-cols-[0.8fr_1.2fr]">
        <div className="relative min-h-[430px] overflow-hidden"><img src="/images/operator-portfolio/bedroom-view.webp" alt="A furnished Philadelphia bedroom with a city view" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" /><p className="absolute bottom-6 left-6 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">Philadelphia · Extended living</p></div>
        <div className="flex items-center p-8 text-white md:p-14 lg:p-20" style={{ background: "#171717" }}><motion.figure {...reveal} className="max-w-3xl"><Quote size={38} strokeWidth={1.3} color="#6597FF" /><blockquote className="mt-10 text-[30px] font-extrabold leading-[1.08] tracking-[-0.03em] md:text-[44px]">“{featured.quote}”</blockquote><figcaption className="mt-10 border-t border-white/20 pt-6"><p className="text-[14px] font-bold">{featured.voice}</p><p className="mt-1 text-[11px] text-white/50">{featured.context}</p></figcaption></motion.figure></div>
      </section>

      <section className="eh-container py-20 md:py-32">
        <motion.div {...reveal} className="flex flex-col justify-between gap-7 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>Different reasons to stay</p><h2 className="mt-5 max-w-3xl text-[42px] font-extrabold leading-[0.97] tracking-[-0.045em] md:text-[64px]">One standard of care.</h2></div><p className="max-w-md text-[13px] leading-relaxed" style={{ color: c.MUTED }}>Business assignments, medical visits, relocation, and family transitions each bring different pressures. The common need is a home and arrival process people can understand.</p></motion.div>

        <div className="mt-16 border-t" style={{ borderColor: c.BORDER }}>{remaining.map((story, index) => <motion.article key={story.voice} {...reveal} transition={{ ...reveal.transition, delay: (index % 2) * 0.05 }} className="grid gap-6 border-b py-10 md:grid-cols-[0.35fr_1.4fr_0.55fr] md:gap-12 md:py-14" style={{ borderColor: c.BORDER }}><div><p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: c.BLUE }}>{story.category}</p><p className="mt-3 text-[11px]" style={{ color: c.MUTED }}>{String(index + 2).padStart(2, "0")}</p></div><blockquote className="text-[23px] font-extrabold leading-[1.25] tracking-[-0.02em] md:text-[29px]">“{story.quote}”</blockquote><footer className="self-end md:self-start"><p className="text-[13px] font-bold">{story.voice}</p><p className="mt-2 text-[11px] leading-relaxed" style={{ color: c.MUTED }}>{story.context}</p></footer></motion.article>)}</div>
      </section>

      <section className="py-20 md:py-28" style={{ background: c.CARD2 }}><div className="eh-container"><motion.div {...reveal}><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>What people value</p><h2 className="mt-5 max-w-3xl text-[40px] font-extrabold leading-[0.97] tracking-[-0.04em] md:text-[58px]">Less chasing.<br />More certainty.</h2></motion.div><div className="mt-14 grid border-y md:grid-cols-3" style={{ borderColor: c.BORDER }}>{[[BriefcaseBusiness, "Clear commercial terms", "A complete quote and applicable policies before payment."], [HeartPulse, "A home that supports real life", "Space, a kitchen, and a setting suited to more than a hotel stay."], [Users, "Support that stays connected", "One team across confirmation, arrival, the stay, and checkout."]].map(([Icon, title, text]) => <article key={title} className="border-b py-8 md:border-b-0 md:border-r md:px-8 md:py-10 md:first:pl-0 md:last:border-r-0" style={{ borderColor: c.BORDER }}><Icon size={25} strokeWidth={1.5} color={c.BLUE} /><h3 className="mt-8 text-[20px] font-extrabold">{title}</h3><p className="mt-3 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{text}</p></article>)}</div></div></section>

      <section className="eh-container py-20 md:py-28"><motion.div {...reveal} className="grid overflow-hidden rounded-[22px] text-white md:grid-cols-[1fr_auto]" style={{ background: "#171717" }}><div className="p-8 md:p-12"><p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#6597FF" }}>Planning stays for a team?</p><h2 className="mt-5 max-w-2xl text-[36px] font-extrabold leading-[0.97] tracking-[-0.04em] md:text-[52px]">Build a clearer Philadelphia housing program.</h2></div><div className="flex items-end p-8 pt-0 md:p-12"><Link to="/contact" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full px-6 text-[13px] font-bold text-white" style={{ background: c.BLUE }}>Contact the team <ArrowRight size={16} /></Link></div></motion.div></section>
    </main>
  );
}
