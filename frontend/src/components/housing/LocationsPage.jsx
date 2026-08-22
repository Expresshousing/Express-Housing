import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Mail } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { pageStyle } from "@/lib/designSystem";

const PHILADELPHIA_NEIGHBORHOODS = [
  { name: "Callowhill", buildings: "Broad + Noble · The Hannah", image: "/images/operator-portfolio/broad-noble-private-terrace.jpg", position: "center 52%" },
  { name: "Logan Square", buildings: "Edgewater II", image: "/images/buildings/edgewater-2/model-interior.jpg", position: "center center" },
  { name: "Rittenhouse Square", buildings: "1500 Locust", image: "/images/operator-portfolio/center-city-rooftop.webp", position: "center 43%" },
];

const NEXT_CITIES = [
  { city: "New York City", note: "Manhattan & Brooklyn corridors" },
  { city: "Washington, D.C.", note: "NoMa & Capitol Riverfront" },
  { city: "Boston", note: "Seaport & Back Bay" },
  { city: "Chicago", note: "Loop & River North" },
];

export default function LocationsPage() {
  const { colors: c } = useTheme();

  const joinWaitlist = (city) => (event) => {
    event.preventDefault();
    toast.success(`Noted — we'll reach out when Express Housing opens in ${city}.`);
  };

  return (
    <div style={pageStyle(c)}>
      <div className="eh-container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 flex items-center justify-center gap-4"><span className="h-0.5 w-8" style={{ background: c.BLUE }} aria-hidden="true" /><p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: c.BLUE }}>Where we operate</p><span className="h-0.5 w-8" style={{ background: c.BLUE }} aria-hidden="true" /></div>
          <h1 className="text-[34px] font-black leading-[1.05] tracking-tighter md:text-[52px]">Philadelphia today.<br />More cities ahead.</h1>
          <p className="mt-5 text-[15px] leading-relaxed md:text-[16px]" style={{ color: c.MUTED }}>Every building is vetted in person before it joins the portfolio, so growth happens one verified city at a time.</p>
        </div>

        <div className="mt-16">
          <div className="mb-8 flex items-center gap-3">
            <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em]" style={{ background: `${c.GREEN}14`, color: c.GREEN }}>Live now</span>
            <h2 className="text-[20px] font-black tracking-tight">Philadelphia, PA</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {PHILADELPHIA_NEIGHBORHOODS.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group relative overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: c.CARD2 }}>
                  <img src={item.image} alt={`${item.name}, Philadelphia`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: item.position }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(10,10,10,0.85) 0%, transparent 60%)" }} />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="flex items-center gap-1.5 text-[15px] font-extrabold text-white"><MapPin size={15} /> {item.name}</p>
                    <p className="mt-1 text-[12px] text-white/75">{item.buildings}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <Link to="/#stay-planner" className="btn-eh mt-8 inline-flex">Browse Philadelphia homes <ArrowRight size={16} /></Link>
        </div>

        <div className="mt-20 border-t pt-16 md:mt-28 md:pt-20" style={{ borderColor: c.BORDER }}>
          <div className="mb-10 flex items-center gap-3">
            <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em]" style={{ background: c.CARD2, color: c.MUTED }}>Expanding to</span>
            <h2 className="text-[20px] font-black tracking-tight">Next on the map</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {NEXT_CITIES.map((item, index) => (
              <motion.div
                key={item.city}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="rounded-2xl p-5"
                style={{ background: c.CARD, border: `1px dashed ${c.BORDER}` }}
              >
                <p className="text-[16px] font-extrabold">{item.city}</p>
                <p className="mt-1 text-[12px]" style={{ color: c.MUTED }}>{item.note}</p>
                <form onSubmit={joinWaitlist(item.city)} className="mt-4">
                  <button type="submit" className="inline-flex items-center gap-1.5 text-[12px] font-bold" style={{ color: c.BLUE }}><Mail size={13} /> Join the waitlist</button>
                </form>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
