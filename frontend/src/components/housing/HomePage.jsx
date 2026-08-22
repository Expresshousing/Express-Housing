import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { pageStyle } from "@/lib/designSystem";
import ScrollTriggeredVideoHero from "@/components/ui/scroll-triggered-video-hero";

const STAY_STORIES = [
  {
    title: "Verified before you arrive",
    text: "Every unit is checked for readiness — cleaning, condition, and Door access — before the arrival page is released.",
    image: "/images/buildings/1500-locust/model-interior.jpg",
  },
  {
    title: "Scheduled Door access",
    text: "Entry opens exactly when your stay begins and closes when it ends. No guessing, no generic codes.",
    image: "/images/buildings/edgewater-2/model-interior.jpg",
  },
  {
    title: "One team, reachable",
    text: "The person who confirms your reservation is the same person you reach if something needs to change.",
    image: "/images/buildings/the-hannah/business-center.jpg",
  },
  {
    title: "Built for every stay length",
    text: "Three nights or three months — the same standard applies, whether it's a quick trip or a full relocation.",
    image: "/images/buildings/1500-locust/building-amenity.jpg",
  },
];

const PORTFOLIO_BUILDINGS = [
  {
    name: "Broad + Noble",
    neighborhood: "Callowhill",
    image: "/images/operator-portfolio/broad-noble-private-terrace.jpg",
    imagePosition: "center 52%",
  },
  {
    name: "The Hannah",
    neighborhood: "Callowhill",
    image: "/images/operator-portfolio/the-hannah-entrance.jpg",
    imagePosition: "center center",
  },
  {
    name: "Edgewater II",
    neighborhood: "Logan Square",
    image: "/images/buildings/edgewater-2/model-interior.jpg",
    imagePosition: "center center",
  },
  {
    name: "1500 Locust",
    neighborhood: "Rittenhouse Square",
    image: "/images/operator-portfolio/center-city-rooftop.webp",
    imagePosition: "center 43%",
  },
];

const TOUR_CHAPTERS = [
  {
    id: "01",
    title: "Arrival",
    subtitle: "A staffed lobby",
    posterUrl: "/images/operator-portfolio/broad-noble-lobby.jpg",
    videoUrl: null,
    description: "Every building is staffed and monitored — a real address for business travel, medical stays, and relocation, not a lockbox.",
  },
  {
    id: "02",
    title: "Unwind",
    subtitle: "Sky deck & lounge",
    posterUrl: "/images/operator-portfolio/broad-noble-sky-deck.webp",
    videoUrl: null,
    description: "Rooftop seating, grills, and a resident lounge give a stay somewhere to decompress after a long shift or travel day.",
  },
  {
    id: "03",
    title: "Recharge",
    subtitle: "Fitness studio",
    posterUrl: "/images/operator-portfolio/broad-noble-gym.jpg",
    videoUrl: null,
    description: "A full fitness studio on-site, so a multi-week stay doesn't mean pausing a routine or hunting for a day pass.",
  },
  {
    id: "04",
    title: "Home",
    subtitle: "The residence",
    posterUrl: "/images/operator-portfolio/broad-noble-kitchen.jpg",
    videoUrl: null,
    description: "Fully furnished one- and two-bedroom homes with a real kitchen, in-unit laundry, and everything set up before arrival.",
  },
];

const STAY_PROCESS = [
  ["01", "Choose with context", "Compare a focused collection by neighborhood, bedroom type, stay length, and the details that matter before you request."],
  ["02", "Review what is confirmed", "See dates, pricing, policies, parking, and the assigned-home details before any payment step."],
  ["03", "Arrive with one plan", "Your private arrival page brings together the address, entry instructions, Door access, Wi-Fi, and support."],
];

export default function HomePage() {
  const { colors: c } = useTheme();
  const location = useLocation();
  const [apartments, setApartments] = useState([]);

  useEffect(() => {
    let active = true;
    api.get("/apartments")
      .then((response) => { if (active) setApartments(Array.isArray(response.data) ? response.data : []); })
      .catch(() => { if (active) setApartments([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const scrollTimer = location.hash === "#stay-planner"
      ? window.setTimeout(() => document.getElementById("stay-planner")?.scrollIntoView({ block: "start" }), 60)
      : null;
    return () => { if (scrollTimer) window.clearTimeout(scrollTimer); };
  }, [location.hash]);

  const buildingCards = useMemo(() => PORTFOLIO_BUILDINGS.map((building) => {
    const listings = apartments.filter((apartment) => apartment.building_name === building.name);
    return {
      ...building,
      image: listings[0]?.images?.[0] || building.image,
      listingId: (listings.find((apartment) => apartment.apt_type === "1 Bedroom") || listings[0])?.id,
    };
  }), [apartments]);

  return (
    <div style={pageStyle(c)}>
      <section id="stay-planner" className="relative left-1/2 w-[100dvw] max-w-none -translate-x-1/2 scroll-mt-24" aria-label="Express Housing furnished apartment portfolio">
        <ScrollTriggeredVideoHero chapters={TOUR_CHAPTERS} accentColor={c.BLUE} />
      </section>

      <section className="py-20 md:py-28 lg:py-36" aria-labelledby="portfolio-heading">
        <div className="eh-container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between gap-6 border-b pb-5" style={{ borderColor: c.BORDER }}><div className="flex items-center gap-3"><span className="h-0.5 w-9" style={{ background: c.BLUE }} aria-hidden="true" /><p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: c.MUTED }}>The collection</p></div><p className="hidden text-[10px] font-bold uppercase tracking-[0.2em] sm:block" style={{ color: c.MUTED }}>04 Philadelphia buildings</p></div>
            <div className="grid gap-8 pb-14 pt-10 md:grid-cols-[1.25fr_0.75fr] md:items-end md:gap-16 md:pb-20 md:pt-14">
              <h2 id="portfolio-heading" className="max-w-[900px] scroll-mt-24 text-[44px] font-extrabold leading-[0.92] tracking-[-0.05em] sm:text-[64px] md:text-[78px] lg:text-[92px]">Four addresses.<br /><span style={{ color: c.BLUE }}>One way to stay.</span></h2>
              <p className="max-w-md text-[15px] leading-relaxed md:pb-2 md:text-[17px]" style={{ color: c.MUTED }}>A deliberately small Philadelphia portfolio, so every home can be prepared, confirmed, and supported by the same team.</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-x-5 gap-y-14 md:grid-cols-12 md:gap-y-20" data-testid="new-listings-grid">
            {buildingCards.map((building, index) => (
              <motion.article
                key={building.name}
                className={`${index % 2 === 0 ? "md:col-span-7" : "md:col-span-5"} ${index === 1 || index === 2 ? "md:mt-12" : ""}`}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link to={building.listingId ? `/apartments/${building.listingId}` : `/?building=${encodeURIComponent(building.name)}#stay-planner`} className="group block" aria-label={`View furnished apartments at ${building.name}`}>
                  <div className={`relative overflow-hidden rounded-[18px] ${index % 2 === 0 ? "aspect-[4/3]" : "aspect-[5/4]"}`}>
                    <img src={building.image} alt={`${building.name} official building or model-home view`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" style={{ objectPosition: building.imagePosition }} loading="lazy" decoding="async" />
                    <span className="absolute left-5 top-5 flex h-9 min-w-9 items-center justify-center rounded-full bg-white px-3 text-[10px] font-extrabold text-black">0{index + 1}</span>
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-5 border-t pt-5" style={{ borderColor: c.BORDER }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: c.MUTED }}>{building.neighborhood} · Philadelphia</p>
                      <h3 className="mt-2 text-[25px] font-extrabold leading-none tracking-[-0.035em] sm:text-[30px]">{building.name}</h3>
                      <p className="mt-2 text-[12px] font-semibold" style={{ color: c.MUTED }}>Furnished one- and two-bedroom homes</p>
                    </div>
                    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border transition-colors group-hover:text-white" style={{ borderColor: c.BORDER }}>
                      <span className="absolute inset-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0" style={{ background: c.BLUE }} />
                      <ArrowUpRight size={17} style={{ color: c.TEXT }} className="relative z-10 transition-colors duration-300 group-hover:text-white" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative left-1/2 w-[100dvw] max-w-none -translate-x-1/2 bg-[#f2f1ee] py-20 text-[#171717] md:py-28 lg:py-36" aria-labelledby="process-heading">
        <div className="eh-container">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-15%" }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <div className="flex items-center justify-between gap-6 border-b border-black/20 pb-5"><div className="flex items-center gap-3"><span className="h-0.5 w-9" style={{ background: c.BLUE }} aria-hidden="true" /><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-black/55">How the stay works</p></div><p className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 sm:block">One guided flow</p></div>
            <div className="grid gap-12 pb-14 pt-10 md:grid-cols-[0.9fr_1.1fr] md:gap-20 md:pb-20 md:pt-14">
              <div>
                <h2 id="process-heading" className="max-w-[720px] text-[42px] font-extrabold leading-[0.92] tracking-[-0.05em] sm:text-[64px] md:text-[76px] lg:text-[88px]">Furnished housing,<br />run like an operation.</h2>
                <p className="mt-7 max-w-lg text-[15px] leading-relaxed text-black/60 md:text-[17px]">Search, confirmation, arrival, and support stay connected. No spreadsheet handoffs. No guessing which email has the current information.</p>
                <Link to="/about" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-black px-5 text-[12px] font-bold text-white">How Express Housing works <ArrowRight size={15} /></Link>
              </div>
              <ol className="border-t border-black/20">
                {STAY_PROCESS.map(([number, title, text]) => <li key={number} className="grid gap-4 border-b border-black/20 py-7 sm:grid-cols-[48px_0.7fr_1.3fr] sm:gap-6"><span className="text-[11px] font-extrabold" style={{ color: c.BLUE }}>{number}</span><h3 className="text-[18px] font-extrabold leading-tight tracking-[-0.02em]">{title}</h3><p className="text-[13px] leading-relaxed text-black/55 md:text-[14px]">{text}</p></li>)}
              </ol>
            </div>
          </motion.div>

          <motion.div className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <figure>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] lg:aspect-[16/11]"><img src="/images/operator-portfolio/broad-noble-private-terrace.jpg" alt="Private terrace at a Philadelphia Express Housing building" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "center 52%" }} loading="lazy" decoding="async" /></div>
              <figcaption className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">Space beyond the apartment · Broad + Noble</figcaption>
            </figure>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              <figure><div className="relative aspect-square overflow-hidden rounded-[18px]"><img src="/images/operator-portfolio/broad-noble-gym.jpg" alt="Fitness studio at Broad and Noble" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" /></div><figcaption className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">Fitness</figcaption></figure>
              <figure><div className="relative aspect-square overflow-hidden rounded-[18px]"><img src="/images/operator-portfolio/broad-noble-study-lounge.webp" alt="Resident study lounge at Broad and Noble" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" /></div><figcaption className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black/45">Work & lounge</figcaption></figure>
            </div>
          </motion.div>

          <div className="mt-10 flex flex-col gap-3 border-t border-black/20 pt-5 text-[11px] leading-relaxed text-black/45 sm:flex-row sm:items-center sm:justify-between"><p>Official building and model-home imagery.</p><p>Private unit and entry details are released only for an approved stay.</p></div>
        </div>
      </section>

      <section className="relative left-1/2 w-[100dvw] max-w-none -translate-x-1/2 overflow-hidden bg-[#0b0b0b] text-white" aria-labelledby="stay-standard-heading">
        <div className="eh-container py-20 md:py-28 lg:py-32">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-15%" }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <div className="flex items-center justify-between gap-6 border-b border-white/20 pb-5">
              <div className="flex items-center gap-3"><span className="h-0.5 w-9" style={{ background: c.BLUE }} aria-hidden="true" /><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">The Express standard</p></div>
              <p className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-white/35 sm:block">Before · during · after</p>
            </div>

            <div className="grid gap-10 pb-16 pt-10 md:grid-cols-[1.45fr_0.55fr] md:items-end md:gap-16 md:pb-24 md:pt-14">
              <h2 id="stay-standard-heading" className="max-w-[920px] text-[42px] font-extrabold leading-[0.92] tracking-[-0.05em] sm:text-[64px] md:text-[78px] lg:text-[96px]">A stay should feel settled before you arrive.</h2>
              <p className="max-w-md text-[15px] leading-relaxed text-white/60 md:pb-2 md:text-[17px]">A real address, a verified home, and one reachable team. We organize the details early so arrival day feels reassuringly uneventful.</p>
            </div>
          </motion.div>

          <div className="grid gap-x-5 gap-y-14 md:grid-cols-2 md:gap-y-20">
            {STAY_STORIES.map((story, index) => (
              <motion.article
                key={story.title}
                className={index === 1 || index === 2 ? "md:mt-16" : ""}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.75, delay: (index % 2) * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={`relative overflow-hidden rounded-[18px] ${index === 0 || index === 3 ? "aspect-[4/3]" : "aspect-[5/4]"}`}>
                  <img src={story.image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]" loading="lazy" decoding="async" />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" aria-hidden="true" />
                  <span className="absolute bottom-5 left-5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[11px] font-extrabold text-black">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="mt-5 grid gap-3 border-t border-white/20 pt-5 sm:grid-cols-[0.8fr_1.2fr] sm:gap-8">
                  <h3 className="text-[19px] font-extrabold leading-tight tracking-[-0.02em] md:text-[22px]">{story.title}</h3>
                  <p className="text-[13px] leading-relaxed text-white/55 md:text-[14px]">{story.text}</p>
                </div>
              </motion.article>
            ))}
          </div>

          <div className="mt-24 flex justify-end border-t border-white/20 pt-6 md:mt-36">
            <p className="max-w-md text-right text-[11px] font-bold uppercase leading-relaxed tracking-[0.18em] text-white/40">One operating standard<br />for every length of stay</p>
          </div>
        </div>
      </section>

      <section className="relative left-1/2 w-[100dvw] max-w-none -translate-x-1/2" style={{ background: c.BG, color: c.TEXT }} aria-labelledby="philadelphia-heading">
        <div className="eh-container py-20 md:py-28 lg:py-36">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-15%" }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <div className="flex items-center gap-3"><span className="h-0.5 w-9" style={{ background: c.BLUE }} aria-hidden="true" /><p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: c.MUTED }}>Philadelphia, Pennsylvania</p></div>
            <h2 id="philadelphia-heading" className="mt-8 max-w-[1120px] text-[44px] font-extrabold leading-[0.92] tracking-[-0.05em] sm:text-[68px] md:text-[88px] lg:text-[108px]">Your next stay,<br /><span style={{ color: c.BLUE }}>already considered.</span></h2>

            <div className="mt-12 grid gap-10 border-t pt-8 md:mt-16 md:grid-cols-[1fr_0.75fr] md:items-end md:gap-16 md:pt-10" style={{ borderColor: c.BORDER }}>
              <p className="max-w-2xl text-[20px] font-bold leading-[1.25] tracking-[-0.02em] md:text-[26px]">Furnished homes across four Philadelphia buildings, ready for business travel, medical visits, relocation, and the plans in between.</p>
              <div className="flex flex-col items-start gap-3 sm:flex-row md:justify-self-end">
                <Link to="/#stay-planner" className="inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-[14px] font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: c.BLUE }}>View available homes <ArrowRight size={16} /></Link>
                <Link to="/contact" className="btn-eh-outline min-h-12 px-6 text-[14px]">Contact the team</Link>
              </div>
            </div>

            <dl className="mt-12 grid grid-cols-3 border-y md:mt-16" style={{ borderColor: c.BORDER }}>
              {[["04", "Philadelphia buildings"], ["01", "Reachable housing team"], ["24/7", "Arrival information"]].map(([value, label]) => <div key={label} className="border-r py-6 pr-3 last:border-r-0 sm:py-8 sm:pl-5 sm:first:pl-0" style={{ borderColor: c.BORDER }}><dt className="text-[24px] font-extrabold leading-none tracking-[-0.04em] sm:text-[32px]">{value}</dt><dd className="mt-2 max-w-[150px] text-[9px] font-bold uppercase leading-relaxed tracking-[0.14em]" style={{ color: c.MUTED }}>{label}</dd></div>)}
            </dl>
          </motion.div>
        </div>

        <motion.figure
          className="eh-container pb-20 md:pb-28"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] sm:aspect-[16/10] lg:aspect-[16/8]">
            <img src="/images/buildings/the-hannah/model-one-bedroom.jpg" alt="Furnished one-bedroom residence at The Hannah in Philadelphia" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-5 text-white sm:p-8">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">The Hannah · Callowhill</p><p className="mt-2 text-[18px] font-extrabold sm:text-[24px]">A real home, ready on arrival.</p></div>
              <Link to="/#stay-planner" className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black sm:flex" aria-label="Explore available homes"><ArrowUpRight size={18} /></Link>
            </div>
          </div>
          <figcaption className="mt-4 flex flex-col gap-2 text-[11px] leading-relaxed sm:flex-row sm:items-center sm:justify-between" style={{ color: c.MUTED }}><span>Official model-home imagery. The assigned home is confirmed before payment.</span><span>Express Housing · Philadelphia</span></figcaption>
        </motion.figure>
      </section>
    </div>
  );
}
