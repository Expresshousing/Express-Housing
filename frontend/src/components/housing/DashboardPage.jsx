import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  DoorOpen,
  Headphones,
  Heart,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  PlayCircle,
  ShieldCheck,
  Trash2,
  Users,
  Wifi,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import SupportChat from "./SupportChat";
import { apiErrorMessage } from "@/lib/apiError";
import { useAuth } from "@/App";
import ApartmentCard from "@/components/housing/ApartmentCard";
import { useTheme } from "@/context/ThemeContext";
import { iconTileStyle, pageStyle, statusStyle } from "@/lib/designSystem";

const ALERT_CONFIG = {
  confirmed: { icon: CheckCircle2, tone: "GREEN", text: (title) => `Great news—your stay at ${title} was approved. Check your email for confirmation.` },
  cancelled: { icon: XCircle, tone: "RED", text: (title) => `Your request for ${title} could not be accommodated. Our team emailed alternatives.` },
  completed: { icon: BadgeCheck, tone: "GREEN", text: (title) => `Your stay at ${title} is complete. We would love to host you again.` },
};

const formatStayDate = (value, options = { month: "short", day: "numeric" }) => (
  value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", options) : "—"
);

function youtubeVideoId(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    let videoId = null;
    if (url.hostname === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0] || null;
    if (url.hostname === "youtube.com" || url.hostname === "www.youtube.com") {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v");
      const [, kind, id] = url.pathname.split("/");
      if (kind === "shorts" || kind === "embed") videoId = id || null;
    }
    return /^[A-Za-z0-9_-]{11}$/.test(videoId || "") ? videoId : null;
  } catch {
    return null;
  }
}

function CopyValue({ label, value, c, secret = false }) {
  if (!value) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 border-t py-4 first:border-t-0" style={{ borderColor: c.BORDER }}>
      <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: c.MUTED }}>{label}</p><p className={`mt-1 truncate text-[16px] font-bold ${secret ? "font-mono tracking-[0.08em]" : ""}`}>{value}</p></div>
      <button type="button" onClick={copy} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border" style={{ borderColor: c.BORDER, color: c.TEXT }} aria-label={`Copy ${label}`}><Copy size={16} /></button>
    </div>
  );
}

function GuideStep({ number, title, summary, children, c, open = false }) {
  return (
    <details className="group border-t py-5 first:border-t-0" style={{ borderColor: c.BORDER }} open={open}>
      <summary className="flex cursor-pointer list-none items-center gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white" style={{ background: c.BLUE }}>{number}</span>
        <span className="min-w-0 flex-1"><span className="block text-[15px] font-bold">{title}</span><span className="mt-0.5 block text-[12px]" style={{ color: c.MUTED }}>{summary}</span></span>
        <ChevronDown size={17} className="shrink-0 transition-transform group-open:rotate-180" style={{ color: c.MUTED }} />
      </summary>
      <div className="ml-[52px] mt-4 whitespace-pre-line text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{children}</div>
    </details>
  );
}

function InfoSection({ icon: Icon, title, description, children, c }) {
  return (
    <section className="border-t py-8" style={{ borderColor: c.BORDER }}>
      <div className="flex items-start gap-4"><div style={iconTileStyle(c.BLUE, 44, 12)}><Icon size={19} /></div><div><h3 className="text-[20px] font-extrabold">{title}</h3>{description && <p className="mt-1 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{description}</p>}</div></div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ArrivalDetails({ booking }) {
  const { colors: c, isDarkMode } = useTheme();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const copyAccessCode = async () => {
    try {
      await navigator.clipboard.writeText(details.access_code);
      toast.success("Access code copied");
    } catch {
      toast.error("Could not copy the access code");
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get(`/bookings/${booking.id}/arrival`)
      .then((response) => { if (active) setDetails(response.data); })
      .catch((error) => { if (active) toast.error(apiErrorMessage(error, "Could not check arrival access")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [booking.id]);

  if (loading) return <div className="mt-6 flex items-center gap-3 rounded-2xl border p-5 text-[13px]" style={{ borderColor: c.BORDER, color: c.MUTED }}><span className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: `${c.BLUE}44`, borderTopColor: c.BLUE }} /> Checking your private stay guide…</div>;

  if (!details?.available) {
    return (
      <div className="mt-6 rounded-2xl border p-5" style={{ background: c.CARD2, borderColor: c.BORDER }} data-testid={`arrival-details-${booking.id}`}>
        <div className="flex items-start gap-4"><div style={iconTileStyle(c.ORANGE, 44, 12)}><Clock3 size={19} /></div><div><p className="text-[15px] font-bold">Your private stay guide is being prepared</p><p className="mt-1 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>Unit number, access, and Wi‑Fi appear here after confirmation, payment, and the final readiness check.{details?.status === "scheduled" && details.release_at ? ` Scheduled release: ${new Date(details.release_at).toLocaleString()}.` : ""}</p></div></div>
      </div>
    );
  }

  const sectionId = (name) => `${name}-${booking.id}`;
  const walkthroughId = youtubeVideoId(details.walkthrough_video_url);
  return (
    <div className="mt-8" data-testid={`arrival-details-${booking.id}`}>
      <section className="overflow-hidden rounded-[20px] text-white" style={{ background: "#171717", boxShadow: isDarkMode ? "none" : "0 12px 36px rgba(0,0,0,0.14)" }}>
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">Express Housing · Arrival pass</p><h3 className="mt-3 text-[26px] font-extrabold leading-tight">{details.building_name}</h3><p className="mt-2 flex items-center gap-2 text-[13px] text-white/65"><MapPin size={14} /> {details.building_address}</p></div><span className="rounded-full px-3 py-1.5 text-[11px] font-bold" style={{ background: `${c.GREEN}22`, color: "#72E6A8", border: "1px solid rgba(114,230,168,0.25)" }}>Access released</span></div>
          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/15 pt-6 sm:grid-cols-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">Check-in</p><p className="mt-1 text-[14px] font-bold">{formatStayDate(booking.check_in)}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">Unit</p><p className="mt-1 text-[14px] font-bold">{details.unit_number}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">Guests</p><p className="mt-1 text-[14px] font-bold">{booking.guests}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">Checkout</p><p className="mt-1 text-[14px] font-bold">{formatStayDate(booking.check_out)}</p></div></div>
          {details.access_code && <div className="mt-6 rounded-xl border border-white/15 p-4"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">Door / fallback code</p><div className="mt-1 flex items-center justify-between"><span className="font-mono text-[24px] font-bold tracking-[0.12em]">{details.access_code}</span><button type="button" onClick={copyAccessCode} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20" aria-label="Copy access code"><Copy size={16} /></button></div></div>}
          <p className="mt-5 text-[11px] leading-relaxed text-white/50">Access window: {new Date(details.access_start).toLocaleString()} → {new Date(details.access_end).toLocaleString()}</p>
        </div>
      </section>

      <nav className="sticky top-20 z-10 mt-5 flex gap-2 overflow-x-auto rounded-2xl border p-2" style={{ background: c.CARD, borderColor: c.BORDER }} aria-label="Stay guide sections">
        {[{ id: "access", label: "Access" }, { id: "wifi", label: "Wi‑Fi" }, { id: "stay", label: "During stay" }, { id: "checkout", label: "Checkout" }].map((item) => <a key={item.id} href={`#${sectionId(item.id)}`} className="min-h-11 shrink-0 rounded-xl px-4 py-3 text-[12px] font-bold" style={{ color: c.TEXT }}>{item.label}</a>)}
      </nav>

      <div id={sectionId("access")} className="scroll-mt-36">
        <InfoSection icon={DoorOpen} title="Access & arrival" description="Follow these steps from the building entrance to your apartment." c={c}>
          {walkthroughId ? (
            <div className="mb-6 overflow-hidden rounded-2xl border" style={{ background: c.CARD2, borderColor: c.BORDER }}>
              <div className="aspect-video bg-black"><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${walkthroughId}`} title={`How to access apartment ${details.unit_number}`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
              <div className="p-5"><div className="flex items-start gap-3"><PlayCircle size={20} className="mt-0.5 shrink-0" color={c.BLUE} /><div><h4 className="text-[15px] font-bold">Watch your apartment access walkthrough</h4>{details.walkthrough_instructions && <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{details.walkthrough_instructions}</p>}<a href={details.walkthrough_video_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-[12px] font-bold" style={{ color: c.BLUE }}>Watch on YouTube ↗</a></div></div></div>
            </div>
          ) : (
            <div className="mb-6 flex items-start gap-4 rounded-2xl border p-5" style={{ background: c.CARD2, borderColor: c.BORDER }}>
              <div style={iconTileStyle(c.BLUE, 44, 12)}><PlayCircle size={19} /></div>
              <div><h4 className="text-[15px] font-bold">Apartment access video</h4><p className="mt-1 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>The video walkthrough has not been added yet. Your written entry steps are available below.</p></div>
            </div>
          )}
          <GuideStep number="1" title="Enter the building" summary="Find the entrance and reach the lobby." c={c} open>{details.building_entry_instructions}</GuideStep>
          {details.concierge_instructions && <GuideStep number="2" title="Concierge or key pickup" summary="Complete any lobby or key handoff." c={c}>{details.concierge_instructions}</GuideStep>}
          <GuideStep number={details.concierge_instructions ? "3" : "2"} title="Find and enter your apartment" summary={`Apartment ${details.unit_number}`} c={c}>{details.unit_entry_instructions}</GuideStep>
          <a href={details.door_app_url} target="_blank" rel="noreferrer" className="btn-eh-outline mt-4 inline-flex gap-2"><KeyRound size={16} /> Open Door instructions</a>
        </InfoSection>
      </div>

      <div id={sectionId("wifi")} className="scroll-mt-36">
        <InfoSection icon={Wifi} title="Wi‑Fi" description="Your private network details for the apartment." c={c}>
          {details.wifi_name ? <div className="rounded-2xl border px-5" style={{ background: c.CARD, borderColor: c.BORDER }}><CopyValue label="Network" value={details.wifi_name} c={c} /><CopyValue label="Password" value={details.wifi_password} c={c} secret /></div> : <p className="text-[13px]" style={{ color: c.MUTED }}>Wi‑Fi details have not been added yet. Contact the team before arrival.</p>}
        </InfoSection>
      </div>

      <div id={sectionId("stay")} className="scroll-mt-36">
        <InfoSection icon={ShieldCheck} title="During your stay" description="Practical building information, organized without the clutter." c={c}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {details.parking_instructions && <div className="rounded-2xl border p-5" style={{ borderColor: c.BORDER }}><Car size={19} color={c.BLUE} /><h4 className="mt-4 text-[15px] font-bold">Parking</h4><p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{details.parking_instructions}</p></div>}
            {details.mail_instructions && <div className="rounded-2xl border p-5" style={{ borderColor: c.BORDER }}><Mail size={19} color={c.BLUE} /><h4 className="mt-4 text-[15px] font-bold">Mail & packages</h4><p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{details.mail_instructions}</p></div>}
            {details.trash_instructions && <div className="rounded-2xl border p-5" style={{ borderColor: c.BORDER }}><Trash2 size={19} color={c.BLUE} /><h4 className="mt-4 text-[15px] font-bold">Trash & recycling</h4><p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{details.trash_instructions}</p></div>}
            <div className="rounded-2xl border p-5" style={{ borderColor: c.BORDER }}><Headphones size={19} color={c.BLUE} /><h4 className="mt-4 text-[15px] font-bold">Guest support</h4><p className="mt-2 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>The Express Housing team can help with reservation, building, or arrival questions.</p><Link to="/contact" className="mt-3 inline-flex min-h-11 items-center text-[13px] font-bold" style={{ color: c.BLUE }}>Contact the team</Link></div>
          </div>
        </InfoSection>
      </div>

      <div id={sectionId("checkout")} className="scroll-mt-36">
        <InfoSection icon={LogOut} title="Checkout" description={`Your stay ends ${formatStayDate(booking.check_out, { weekday: "long", month: "long", day: "numeric" })}.`} c={c}>
          <div className="rounded-2xl border p-5 text-[13px] leading-relaxed" style={{ background: c.CARD2, borderColor: c.BORDER, color: c.MUTED }}>{details.checkout_instructions || "Checkout instructions will be confirmed by the Express Housing team before departure."}</div>
        </InfoSection>
      </div>
    </div>
  );
}

function StayCard({ booking, c }) {
  return (
    <article className="stagger-item overflow-hidden rounded-[20px] border" style={{ background: c.CARD, borderColor: c.BORDER }} data-testid={`booking-${booking.id}`}>
      <div className="relative h-64 overflow-hidden md:h-80"><img src={booking.apartment_image} alt="" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/15" /><div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">{booking.neighborhood} · {booking.status}</p><span style={statusStyle(booking.status, c)} data-testid={`booking-status-${booking.id}`}>{booking.status}</span></div><Link to={`/apartments/${booking.apartment_id}`} className="mt-3 block max-w-2xl text-[28px] font-extrabold leading-[1.02] text-white md:text-[40px]">{booking.apartment_title}</Link></div></div>
      <div className="p-5 md:p-8">
        <div className="grid grid-cols-2 gap-5 border-b pb-6 sm:grid-cols-4" style={{ borderColor: c.BORDER }}><div><p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: c.MUTED }}>Check-in</p><p className="mt-1 text-[14px] font-bold">{formatStayDate(booking.check_in)}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: c.MUTED }}>Checkout</p><p className="mt-1 text-[14px] font-bold">{formatStayDate(booking.check_out)}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: c.MUTED }}>Guests</p><p className="mt-1 flex items-center gap-1.5 text-[14px] font-bold"><Users size={14} /> {booking.guests}</p></div><div><p className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: c.MUTED }}>Estimated total</p><p className="mt-1 text-[14px] font-bold">${booking.total_price.toLocaleString()}</p></div></div>
        {booking.status === "pending" && <div className="mt-6 flex items-start gap-4"><div style={iconTileStyle(c.ORANGE, 44, 12)}><Clock3 size={19} /></div><div><p className="text-[15px] font-bold">We’re reviewing your request</p><p className="mt-1 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>We’ll confirm the assigned home, final rate, and next steps by email.</p></div></div>}
        {(booking.status === "confirmed" || booking.status === "completed") && <ArrivalDetails booking={booking} />}
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { colors: c } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab = ["saved", "support"].includes(requestedTab) ? requestedTab : "stays";
  const [bookings, setBookings] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusAlerts, setStatusAlerts] = useState([]);
  const [supportUnread, setSupportUnread] = useState(0);

  const wasAuthedRef = useRef(false);
  useEffect(() => { if (user) wasAuthedRef.current = true; }, [user]);
  useEffect(() => {
    if (authLoading || user) return;
    // A user who was signed in during this visit and lost auth (e.g. clicked
    // Logout) is already being navigated away by that action itself — forcing
    // another redirect here races it and can reopen the sign-in modal.
    if (wasAuthedRef.current) return;
    navigate("/login", { replace: true, state: { from: location.pathname } });
  }, [authLoading, user, navigate, location.pathname]);
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.get("/support/unread").then(({ data }) => setSupportUnread(data.unread || 0)).catch(() => {});
    Promise.all([api.get("/bookings"), api.get("/wishlist")]).then(([bookingsResponse, wishlistResponse]) => {
      setBookings(bookingsResponse.data); setSaved(wishlistResponse.data);
      try { const key = `eh_seen_statuses_${user.id}`; const seen = JSON.parse(localStorage.getItem(key) || "{}"); setStatusAlerts(bookingsResponse.data.filter((booking) => seen[booking.id] && seen[booking.id] !== booking.status && ALERT_CONFIG[booking.status])); const next = {}; bookingsResponse.data.forEach((booking) => { next[booking.id] = booking.status; }); localStorage.setItem(key, JSON.stringify(next)); } catch { /* Storage can be unavailable without affecting the portal. */ }
    }).finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return null;
  const tabs = [{ key: "stays", label: `My stays (${bookings.length})` }, { key: "saved", label: `Saved (${saved.length})` }, { key: "support", label: "Support", badge: supportUnread }];

  return (
    <div className="pb-20 pt-10" style={pageStyle(c)} data-testid="dashboard">
      <div className="eh-container">
        <div className="flex items-center gap-4"><span className="h-0.5 w-8" style={{ background: c.BLUE }} aria-hidden="true" /><p className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: c.BLUE }}>My Express Housing</p></div>
        <h1 className={`max-w-4xl font-extrabold leading-[0.94] ${tab === "support" ? "mt-4 text-[30px] md:text-[38px]" : "mt-6 text-[46px] md:text-[68px]"}`}>{tab === "support" ? `Support for ${user.name.split(" ")[0]}` : <>Welcome back,<br />{user.name.split(" ")[0]}.</>}</h1>
        {tab !== "support" && <p className="mt-6 max-w-xl text-[15px] leading-relaxed md:text-[17px]" style={{ color: c.MUTED }}>Everything for your reservation, arrival, stay, and checkout—kept together and released when it’s ready.</p>}

        {statusAlerts.length > 0 && <div className="mt-8 space-y-2" data-testid="status-alerts">{statusAlerts.map((alert) => { const config = ALERT_CONFIG[alert.status]; const tone = c[config.tone]; return <div key={alert.id} className="flex items-start gap-3 rounded-xl px-4 py-3 text-[13px]" style={{ background: `${tone}12`, border: `1px solid ${tone}33`, color: c.TEXT }} data-testid={`status-alert-${alert.id}`}><config.icon size={18} color={tone} /><p className="flex-1">{config.text(alert.apartment_title)} <span style={{ color: c.MUTED }}>({alert.check_in} → {alert.check_out})</span></p><button type="button" onClick={() => setStatusAlerts((current) => current.filter((item) => item.id !== alert.id))} aria-label="Dismiss" className="flex items-center justify-center rounded-lg" style={{ color: c.MUTED }}><X size={16} /></button></div>; })}</div>}

        <div className={`flex gap-2 border-b ${tab === "support" ? "mt-6" : "mt-12"}`} style={{ borderColor: c.BORDER }}>{tabs.map((item) => <button type="button" key={item.key} onClick={() => { setSearchParams(item.key === "stays" ? {} : { tab: item.key }); if (item.key === "support") setSupportUnread(0); }} className="nav-btn flex items-center gap-2 rounded-t-xl px-4 py-3 text-[14px] font-bold" style={{ color: tab === item.key ? c.TEXT : c.MUTED, borderBottom: `2px solid ${tab === item.key ? c.BLUE : "transparent"}` }} data-testid={`dashboard-tab-${item.key}`}>{item.label}{item.badge > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold" style={{ background: "#DC2626", color: "#FFFFFF" }} data-testid="support-unread-badge">{item.badge}</span>}</button>)}</div>

        {tab === "support" ? <SupportChat /> : loading ? <div className="py-20 text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: `${c.BLUE}33`, borderTopColor: c.BLUE }} /></div> : tab === "stays" ? (
          bookings.length === 0 ? <EmptyState icon={CalendarDays} title="No stays yet" text="Find a furnished home and send your first request." c={c} /> : <div className="mt-10 space-y-10" data-testid="bookings-list">{bookings.map((booking) => <StayCard key={booking.id} booking={booking} c={c} />)}</div>
        ) : saved.length === 0 ? <EmptyState icon={Heart} title="Nothing saved yet" text="Tap the heart on any apartment to keep it here." c={c} /> : <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="saved-grid">{saved.map((apartment) => <ApartmentCard key={apartment.id} apartment={apartment} />)}</div>}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text, c }) {
  return <div className="py-24 text-center"><div className="mx-auto" style={iconTileStyle(c.BLUE, 56, 16)}><Icon size={24} /></div><h2 className="mt-5 text-[22px] font-black tracking-tight">{title}</h2><p className="mb-7 mt-2 text-[14px]" style={{ color: c.MUTED }}>{text}</p><Link to="/#stay-planner" className="btn-eh">Find a stay</Link></div>;
}
