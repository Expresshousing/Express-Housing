import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll } from "framer-motion";
import { ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_CHAPTERS = [
  {
    id: "01",
    title: "Arrival",
    subtitle: "The lobby",
    posterUrl: "/images/operator-portfolio/broad-noble-lobby.jpg",
    videoUrl: null,
    description: "A staffed entrance and a real address — not a mailbox drop.",
  },
];

const textContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const textReveal = {
  hidden: { y: "100%", opacity: 0 },
  visible: { y: "0%", opacity: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4, ease: "easeOut" } },
};

function FilmGrain() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 opacity-[0.07] mix-blend-overlay">
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />
    </div>
  );
}

function ChapterMedia({ chapters, activeIndex }) {
  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden bg-black">
      {chapters.map((chapter, index) => (
        <motion.div
          key={chapter.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: index === activeIndex ? 1 : 0, zIndex: index === activeIndex ? 10 : 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 h-full w-full"
        >
          {chapter.videoUrl ? (
            <video src={chapter.videoUrl} poster={chapter.posterUrl} className="h-full w-full object-cover" autoPlay muted loop playsInline />
          ) : (
            <motion.img
              src={chapter.posterUrl}
              alt={chapter.subtitle}
              className="h-full w-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              initial={{ scale: 1 }}
              animate={{ scale: index === activeIndex ? 1.08 : 1 }}
              transition={{ duration: 8, ease: "linear" }}
            />
          )}
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-transparent" />
        </motion.div>
      ))}
      <FilmGrain />
    </div>
  );
}

function TourNav({ chapters, activeIndex, accentColor }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-50 px-5 pb-5 text-white sm:px-8 sm:pb-7 lg:px-12">
      <div className="mx-auto flex max-w-[1440px] items-end justify-between gap-6">
        <div className="hidden rounded-full bg-black/55 px-4 py-3 backdrop-blur-sm sm:block">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/50">Property tour</p>
          <AnimatePresence mode="wait">
            <motion.p key={activeIndex} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="mt-0.5 text-[11px] font-bold">{chapters[activeIndex].title} · {chapters[activeIndex].subtitle}</motion.p>
          </AnimatePresence>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-black/55 px-4 py-3 backdrop-blur-sm" aria-label={`Chapter ${activeIndex + 1} of ${chapters.length}`}>
          <div className="flex gap-1.5" aria-hidden="true">
            {chapters.map((chapter, index) => <span key={chapter.id} className="h-1.5 rounded-full transition-all duration-300" style={{ width: index === activeIndex ? 20 : 6, background: index === activeIndex ? accentColor : "rgba(255,255,255,0.4)" }} />)}
          </div>
          <p className="ml-2 text-[10px] font-bold tabular-nums">{chapters[activeIndex].id}/{String(chapters.length).padStart(2, "0")}</p>
        </div>
      </div>
    </div>
  );
}

export default function ScrollTriggeredVideoHero({ chapters = DEFAULT_CHAPTERS, accentColor = "#FF385C", ctaHref = "#portfolio-heading", ctaLabel = "Browse available homes", className }) {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const newIndex = Math.min(Math.floor(latest * chapters.length), chapters.length - 1);
      setActiveIndex(newIndex);
    });
    return () => unsubscribe();
  }, [scrollYProgress, chapters.length]);

  return (
    <section ref={containerRef} className={cn("relative w-full", className)} style={{ height: `${chapters.length * 100}svh` }} data-testid="property-tour-hero">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <ChapterMedia chapters={chapters} activeIndex={activeIndex} />
        <TourNav chapters={chapters} activeIndex={activeIndex} accentColor={accentColor} />
      </div>

      <div className="pointer-events-none absolute inset-0 top-0 z-30">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="flex h-[100svh] w-full items-center px-5 pb-24 pt-24 sm:px-8 lg:px-12">
            <motion.div
              variants={textContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, margin: "-20%" }}
              className="pointer-events-auto mx-auto w-full max-w-[1440px]"
            >
              <motion.div variants={fadeIn} className="mb-5">
                <span className="inline-flex rounded-full bg-black/45 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/75 backdrop-blur-sm">Chapter {chapter.id} · {chapter.title}</span>
              </motion.div>

              <div className="max-w-[1100px] overflow-hidden py-2">
                {chapter.id === "01" ? <motion.h1 variants={textReveal} className="max-w-[96vw] text-[46px] font-extrabold leading-[0.9] tracking-[-0.055em] text-white sm:text-[76px] md:text-[96px] lg:text-[120px]">Philadelphia,<br />ready for your stay.</motion.h1> : <motion.h2 variants={textReveal} className="max-w-[96vw] text-[46px] font-extrabold leading-[0.9] tracking-[-0.055em] text-white sm:text-[76px] md:text-[96px] lg:text-[120px]">{chapter.subtitle}</motion.h2>}
              </div>

              <motion.div variants={fadeIn} className="mt-8 grid max-w-[780px] gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
                <p className="max-w-xl text-[15px] font-medium leading-relaxed text-white/75 sm:text-[17px]">{chapter.description}</p>
                <a href={ctaHref} className="group inline-flex min-h-11 items-center gap-2 justify-self-start text-[11px] font-bold uppercase tracking-[0.14em] text-white">{ctaLabel}<span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 transition-colors group-hover:bg-white group-hover:text-black"><ArrowDownRight size={15} /></span></a>
              </motion.div>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
