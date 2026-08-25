import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const steps = [
  ["01", "Start with context", "Give people enough information to choose without drowning them in options."],
  ["02", "Confirm the details", "Place terms, timing, and the next action together before commitment."],
  ["03", "Keep one clear path", "Carry the same language and hierarchy through every later step."],
];

export default function EditorialLandingSection() {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-12%" }, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } };

  return (
    <section className="bg-[#f2f1ee] py-20 text-[#171717] md:py-28 lg:py-36" aria-labelledby="process-heading">
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6">
        <motion.div {...reveal}>
          <div className="flex items-center justify-between gap-6 border-b border-black/20 pb-5">
            <div className="flex items-center gap-3">
              <span className="h-0.5 w-9 bg-[#ff385c]" aria-hidden="true" />
              <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-black/55">The process</p>
            </div>
            <p className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 sm:block">One guided flow</p>
          </div>

          <div className="grid gap-12 pb-14 pt-10 md:grid-cols-[0.9fr_1.1fr] md:gap-20 md:pb-20 md:pt-14">
            <div>
              <h2 id="process-heading" className="max-w-[720px] text-[42px] font-extrabold leading-[0.92] tracking-[-0.05em] sm:text-[64px] md:text-[76px] lg:text-[88px]">
                Complex work.<br />A calm experience.
              </h2>
              <p className="mt-7 max-w-lg text-[15px] leading-relaxed text-black/60 md:text-[17px]">Use hierarchy, honest boundaries, and one visible next action to make a detailed system feel understandable.</p>
              <a href="#next" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-6 text-[13px] font-bold text-white">
                See how it works <ArrowRight size={16} />
              </a>
            </div>
            <ol className="border-t border-black/20">
              {steps.map(([number, title, text]) => (
                <li key={number} className="grid gap-4 border-b border-black/20 py-7 sm:grid-cols-[48px_0.7fr_1.3fr] sm:gap-6">
                  <span className="text-[11px] font-extrabold text-[#ff385c]">{number}</span>
                  <h3 className="text-[18px] font-extrabold leading-tight tracking-[-0.02em]">{title}</h3>
                  <p className="text-[13px] leading-relaxed text-black/55 md:text-[14px]">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

