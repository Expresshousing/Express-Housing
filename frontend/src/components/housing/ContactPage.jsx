import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, Mail, MapPin, Send, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { pageStyle } from "@/lib/designSystem";

const TOPICS = [
  ["Stay or booking question", "Share the building, dates, number of guests, and what you need help deciding."],
  ["Corporate housing", "Tell us about your travel program, expected stay pattern, and Philadelphia housing needs."],
  ["Building partnership", "Introduce the property, available inventory, operating model, and partnership contact."],
  ["Careers", "Tell us what area of the company you are interested in and the work you would want to contribute."],
  ["Something else", "Use this for a question that does not fit one of the categories above."],
];

const QUERY_TOPICS = { "building-partnership": "Building partnership", corporate: "Corporate housing", careers: "Careers" };
const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-12%" }, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } };

export default function ContactPage() {
  const { colors: c } = useTheme();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", subject: "Stay or booking question", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (key) => (event) => { setSent(false); setForm((current) => ({ ...current, [key]: event.target.value })); };

  useEffect(() => {
    const requestedTopic = QUERY_TOPICS[searchParams.get("topic")];
    if (requestedTopic) setForm((current) => ({ ...current, subject: requestedTopic }));
  }, [searchParams]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/contact", form);
      toast.success(response.data.message);
      setSent(true);
      setForm((current) => ({ name: "", email: "", subject: current.subject, message: "" }));
    } catch {
      toast.error("Could not send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const activeTopic = TOPICS.find(([title]) => title === form.subject);

  return (
    <main style={pageStyle(c)}>
      <section className="eh-container pb-16 pt-12 md:pb-24 md:pt-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div><div className="flex items-center gap-4"><span className="h-0.5 w-10" style={{ background: c.BLUE }} aria-hidden="true" /><p className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: c.BLUE }}>Contact Express Housing</p></div><motion.h1 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }} className="mt-9 max-w-4xl text-[56px] font-extrabold leading-[0.87] tracking-[-0.06em] sm:text-[76px] md:text-[98px]">Start with the details.</motion.h1></div>
          <div><p className="text-[19px] font-bold leading-[1.3] md:text-[23px]">A clear answer starts with a clear picture of the stay, partnership, or question.</p><p className="mt-5 max-w-xl text-[14px] leading-relaxed" style={{ color: c.MUTED }}>Send the information you already have. The Express Housing team will review it and follow up with the most relevant next step.</p></div>
        </div>
      </section>

      <section className="relative h-[42vh] min-h-[380px] max-h-[620px] overflow-hidden"><img src="/images/operator-portfolio/broad-noble-bar-lounge.webp" alt="A furnished resident lounge in Philadelphia" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" /><div className="eh-container absolute inset-x-0 bottom-0 pb-8"><div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/75"><span className="flex items-center gap-2 rounded-full border border-white/30 bg-black/25 px-4 py-2"><MapPin size={13} /> Philadelphia</span><a href="mailto:stay@expresshousing.com" className="flex items-center gap-2 rounded-full border border-white/30 bg-black/25 px-4 py-2"><Mail size={13} /> stay@expresshousing.com</a></div></div></section>

      <section className="eh-container py-20 md:py-32">
        <div className="grid gap-14 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <motion.aside {...reveal} className="lg:sticky lg:top-28 lg:self-start"><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>Choose a conversation</p><h2 className="mt-5 text-[38px] font-extrabold leading-[0.98] tracking-[-0.04em] md:text-[52px]">What can we help move forward?</h2><div className="mt-10 border-t" style={{ borderColor: c.BORDER }}>{TOPICS.map(([title, description], index) => <button key={title} type="button" onClick={() => { setSent(false); setForm((current) => ({ ...current, subject: title })); }} className="flex min-h-[72px] w-full items-center justify-between gap-4 border-b text-left" style={{ borderColor: c.BORDER, color: form.subject === title ? c.BLUE : c.MUTED }} aria-pressed={form.subject === title}><span><strong className="block text-[14px]">{title}</strong>{form.subject === title && <span className="mt-1 block text-[11px] leading-relaxed" style={{ color: c.MUTED }}>{description}</span>}</span><span className="text-[10px] font-bold opacity-60">{String(index + 1).padStart(2, "0")}</span></button>)}</div></motion.aside>

          <motion.div {...reveal} className="overflow-hidden rounded-[22px] border" style={{ background: c.CARD, borderColor: c.BORDER }}>
            <div className="p-6 md:p-10"><div className="flex flex-wrap items-start justify-between gap-5 border-b pb-7" style={{ borderColor: c.BORDER }}><div><p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: c.BLUE }}>Inquiry</p><h2 className="mt-3 text-[28px] font-extrabold leading-none md:text-[36px]">Tell us what you know.</h2></div><Send size={26} strokeWidth={1.5} color={c.BLUE} /></div>
              {sent && <div className="mt-6 flex items-start gap-3 rounded-2xl border p-4" style={{ background: `${c.GREEN}0D`, borderColor: `${c.GREEN}44` }} role="status"><CheckCircle2 size={19} className="mt-0.5 shrink-0" color={c.GREEN} /><div><p className="text-[14px] font-bold">Message received</p><p className="mt-1 text-[12px] leading-relaxed" style={{ color: c.MUTED }}>Your inquiry was sent to Express Housing. Keep this page open if you would like to send another message.</p></div></div>}
              <form onSubmit={submit} className="mt-7 space-y-6" data-testid="contact-form">
                <div><label className="label-eh" htmlFor="contact-topic">What is this about?</label><select id="contact-topic" required className="input-eh" value={form.subject} onChange={set("subject")} data-testid="contact-subject">{TOPICS.map(([title]) => <option key={title} value={title}>{title}</option>)}</select><p className="mt-2 text-[11px] leading-relaxed" style={{ color: c.MUTED }}>{activeTopic?.[1]}</p></div>
                <div className="grid gap-5 sm:grid-cols-2"><div><label className="label-eh" htmlFor="contact-name">Name</label><input id="contact-name" required autoComplete="name" className="input-eh" value={form.name} onChange={set("name")} data-testid="contact-name" /></div><div><label className="label-eh" htmlFor="contact-email">Email</label><input id="contact-email" type="email" required autoComplete="email" className="input-eh" value={form.email} onChange={set("email")} data-testid="contact-email" /></div></div>
                <div><label className="label-eh" htmlFor="contact-message">Details</label><textarea id="contact-message" required rows={8} className="input-eh" value={form.message} onChange={set("message")} placeholder="Include dates, building, stay length, guest count, company, property, or any other details that will help us understand the request." data-testid="contact-message" /></div>
                <div className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: c.BORDER }}><p className="max-w-md text-[10px] leading-relaxed" style={{ color: c.MUTED }}>Do not include payment card information, access codes, passwords, medical details, or other sensitive information.</p><button type="submit" className="btn-eh shrink-0" disabled={loading} data-testid="contact-submit">{loading ? "Sending…" : <>Send inquiry <ArrowRight size={16} /></>}</button></div>
              </form>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28" style={{ background: c.CARD2 }}><div className="eh-container"><motion.div {...reveal}><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>What happens next</p><h2 className="mt-5 max-w-3xl text-[42px] font-extrabold leading-[0.97] tracking-[-0.045em] md:text-[62px]">Your question reaches the right part of the operation.</h2></motion.div><div className="mt-14 grid border-y md:grid-cols-3" style={{ borderColor: c.BORDER }}>{[[BriefcaseBusiness, "Stay planning", "Availability, building fit, pricing, parking, and reservation questions."], [Users, "Programs and partnerships", "Corporate housing needs and conversations with Philadelphia building teams."], [Building2, "Arrival and building support", "Existing guests should include their building and confirmed stay dates so the team can locate the reservation." ]].map(([Icon, title, text]) => <article key={title} className="border-b py-8 md:border-b-0 md:border-r md:px-8 md:py-10 md:first:pl-0 md:last:border-r-0" style={{ borderColor: c.BORDER }}><Icon size={25} strokeWidth={1.5} color={c.BLUE} /><h3 className="mt-8 text-[20px] font-extrabold">{title}</h3><p className="mt-3 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{text}</p></article>)}</div></div></section>
    </main>
  );
}
