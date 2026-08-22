import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Mail, MapPin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const exploreLinks = [
  ["Available homes", "/#stay-planner"],
  ["Philadelphia locations", "/locations"],
  ["My stays", "/dashboard"],
];

const companyLinks = [
  ["About us", "/about"],
  ["Testimonials", "/testimonials"],
  ["Careers", "/careers"],
  ["FAQ", "/faq"],
];

function FooterLinks({ title, links }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">{title}</p>
      <ul className="mt-5 space-y-1">{links.map(([label, to]) => <li key={label}><Link to={to} className="group inline-flex min-h-10 items-center gap-1.5 text-[13px] font-bold text-white/65 transition-colors hover:text-white">{label}<ArrowUpRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" /></Link></li>)}</ul>
    </div>
  );
}

export default function Footer() {
  const { colors: c } = useTheme();

  return (
    <footer className="overflow-hidden text-white" style={{ background: "#141414" }}>
      <div className="eh-container">
        <section className="grid gap-10 border-b border-white/15 py-14 md:grid-cols-[1fr_auto] md:items-end md:py-20" aria-labelledby="footer-heading">
          <div>
            <div className="flex items-center gap-3"><span className="h-0.5 w-8" style={{ background: "#6597FF" }} aria-hidden="true" /><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Your Philadelphia stay</p></div>
            <h2 id="footer-heading" className="mt-7 max-w-[780px] text-[40px] font-extrabold leading-[0.93] tracking-[-0.05em] sm:text-[52px] md:text-[68px]">A furnished home.<br />A clearer arrival.</h2>
            <p className="mt-6 max-w-xl text-[13px] leading-relaxed text-white/45">Managed furnished stays across a focused collection of Philadelphia buildings, with reservation and arrival details organized in one place.</p>
          </div>
          <Link to="/#stay-planner" className="inline-flex min-h-12 shrink-0 items-center gap-2 justify-self-start rounded-full px-6 text-[13px] font-bold text-white transition-transform hover:-translate-y-0.5" style={{ background: c.BLUE }}>Explore available homes <ArrowRight size={16} /></Link>
        </section>

        <section className="grid gap-12 py-12 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.65fr_0.65fr_0.9fr] lg:gap-16" aria-label="Footer navigation and contact">
          <div>
            <p className="text-[18px] font-extrabold tracking-[-0.03em]">Express Housing</p>
            <p className="mt-4 max-w-xs text-[12px] leading-relaxed text-white/40">Furnished homes for business travel, medical visits, relocation, and extended stays in Philadelphia.</p>
            <p className="mt-6 flex items-center gap-2 text-[11px] font-bold text-white/55"><MapPin size={14} color="#6597FF" /> Philadelphia, Pennsylvania</p>
          </div>
          <FooterLinks title="Explore" links={exploreLinks} />
          <FooterLinks title="Company" links={companyLinks} />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">Need help?</p>
            <p className="mt-5 max-w-xs text-[12px] leading-relaxed text-white/45">Questions about availability, an existing stay, or a building partnership?</p>
            <Link to="/contact" className="mt-4 inline-flex min-h-10 items-center gap-2 text-[13px] font-bold" style={{ color: "#80A7FF" }}>Contact us <ArrowRight size={14} /></Link>
            <a href="mailto:stay@expresshousing.com" className="mt-2 flex min-h-10 items-center gap-2 text-[11px] text-white/45 hover:text-white"><Mail size={13} /> stay@expresshousing.com</a>
          </div>
        </section>

        <div className="flex flex-col gap-3 py-6 text-[10px] text-white/30 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 Express Housing. Philadelphia, PA.</span><span>Furnished stays · Managed arrival · Guest support</span></div>
      </div>
    </footer>
  );
}
