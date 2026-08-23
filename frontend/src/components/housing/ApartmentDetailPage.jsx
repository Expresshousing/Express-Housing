import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Armchair,
  Ban,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  Check,
  ChevronLeft,
  Clock3,
  CookingPot,
  DoorOpen,
  ExternalLink,
  Headphones,
  Heart,
  Image as ImageIcon,
  KeyRound,
  MapPin,
  ReceiptText,
  Ruler,
  ShieldCheck,
  Star,
  Users,
  Volume2,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiError";
import { todayISO } from "@/lib/date";
import { useAuth } from "@/App";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle, iconTileStyle, microBadgeStyle, pageStyle } from "@/lib/designSystem";
import ApartmentGallery from "@/components/housing/apartmentGallery";

const PURPOSES = [{ value: "business", label: "Business travel" }, { value: "medical", label: "Medical stay" }, { value: "family", label: "Family visit" }, { value: "relocation", label: "Relocation" }, { value: "leisure", label: "Leisure" }];

const pendingBookingKey = (apartmentId) => `eh_pending_booking_${apartmentId}`;

const BUILDING_CONTEXT = {
  "Broad + Noble": "A North Broad Street address in Callowhill with a direct connection to Center City Philadelphia.",
  "The Hannah": "A Callowhill address designed for an easy Philadelphia stay near the North Broad Street corridor.",
  "Edgewater II": "A Logan Square address near the Schuylkill riverfront and central Philadelphia.",
  "1500 Locust": "A Rittenhouse Square address in the center of Philadelphia's dining, business, and cultural district.",
};

function ToneNotice({ color, children, testId }) {
  return <div className="rounded-xl p-3 text-[13px] leading-relaxed" style={{ color, background: `${color}12`, border: `1px solid ${color}33` }} data-testid={testId}>{children}</div>;
}

function DetailSection({ id, eyebrow, title, description, children, c }) {
  return (
    <motion.section
      className="mt-20 border-t pt-16 first:mt-0 first:border-t-0 first:pt-0 md:mt-24 md:pt-20"
      style={{ borderColor: c.BORDER }}
      aria-labelledby={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-8 md:mb-10">
        {eyebrow && (
          <div className="mb-3 flex items-center gap-3">
            <span className="h-0.5 w-8" style={{ background: c.BLUE }} aria-hidden="true" />
            <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>{eyebrow}</p>
          </div>
        )}
        <h2 id={id} className="max-w-2xl text-[34px] font-extrabold leading-[1.02] md:text-[48px]" style={{ color: c.TEXT }}>{title}</h2>
        {description && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed md:text-[17px]" style={{ color: c.MUTED }}>{description}</p>}
      </div>
      {children}
    </motion.section>
  );
}

function FeatureCard({ icon: Icon, title, description, color, c, isDarkMode }) {
  return (
    <div className="flex gap-4 border-t py-5" style={{ borderColor: c.BORDER }}>
      <div style={iconTileStyle(color, 44, 12)}><Icon size={20} /></div>
      <div className="min-w-0">
        <h3 className="text-[15px] font-bold" style={{ color: c.TEXT }}>{title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{description}</p>
      </div>
    </div>
  );
}

function ThingsCard({ icon: Icon, title, description, items, c, isDarkMode }) {
  return (
    <article className="rounded-2xl border p-5 md:p-6" style={{ background: c.CARD, borderColor: c.BORDER }}>
      <div style={iconTileStyle(c.BLUE, 44, 12)}><Icon size={20} /></div>
      <h3 className="mt-5 text-[18px] font-bold" style={{ color: c.TEXT }}>{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{description}</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[13px] leading-relaxed" style={{ color: c.TEXT }}>
            <Check size={15} color={c.GREEN} className="mt-0.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function ApartmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, wishlistIds, toggleWishlist } = useAuth();
  const { colors: c, isDarkMode } = useTheme();
  const [apt, setApt] = useState(null);
  const [portfolioApartments, setPortfolioApartments] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const [unavailable, setUnavailable] = useState([]);
  const [unavailableLoaded, setUnavailableLoaded] = useState(false);
  const [mainImg, setMainImg] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [checkIn, setCheckIn] = useState(() => searchParams.get("check_in") || "");
  const [checkOut, setCheckOut] = useState(() => searchParams.get("check_out") || "");
  const [guests, setGuests] = useState(() => Math.max(1, Number(searchParams.get("guests")) || 1));
  const [purpose, setPurpose] = useState(() => ({ corporate: "business", medical: "medical", family: "family" }[searchParams.get("stay_path")] || "business"));
  const [notes, setNotes] = useState("");
  const [parkingRequested, setParkingRequested] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const bookingStartRef = useRef(null);

  useEffect(() => {
    setNotFound(false);
    setMainImg(0);
    setGalleryOpen(false);
    setUnavailableLoaded(false);
    api.get(`/apartments/${id}`).then((response) => setApt(response.data)).catch(() => setNotFound(true));
    api.get(`/apartments/${id}/unavailable`)
      .then((response) => setUnavailable(response.data))
      .catch(() => setUnavailable([]))
      .finally(() => setUnavailableLoaded(true));
    api.get("/apartments").then((response) => setPortfolioApartments(response.data)).catch(() => setPortfolioApartments([]));
  }, [id]);
  useEffect(() => { if (apt && guests > apt.max_guests) setGuests(apt.max_guests); }, [apt, guests]);
  const today = todayISO();
  const conflict = useMemo(() => { if (!checkIn || !checkOut) return null; return unavailable.find((item) => checkIn < item.check_out && checkOut > item.check_in) || null; }, [checkIn, checkOut, unavailable]);
  const nights = useMemo(() => { if (!checkIn || !checkOut) return 0; const diff = (new Date(checkOut) - new Date(checkIn)) / 86400000; return diff > 0 ? Math.round(diff) : 0; }, [checkIn, checkOut]);
  const nearbyStays = useMemo(() => {
    if (!apt) return [];
    return portfolioApartments
      .filter((item) => item.id !== apt.id)
      .sort((a, b) => {
        const score = (item) => (item.building_name === apt.building_name ? 2 : item.neighborhood === apt.neighborhood ? 1 : 0);
        return score(b) - score(a);
      })
      .slice(0, 3);
  }, [apt, portfolioApartments]);
  // Physical unit inventory (which of the ~5 units per type) is admin-only —
  // guests only ever choose the bedroom type here; the admin assigns the
  // actual unit after the reservation is confirmed.
  const roomTypeOptions = useMemo(() => {
    if (!apt) return [];
    return portfolioApartments
      .filter((item) => item.building_name === apt.building_name)
      .sort((a, b) => a.bedrooms - b.bedrooms);
  }, [apt, portfolioApartments]);

  useEffect(() => {
    if (!apt || !checkIn || !checkOut || nights < 1) { setQuote(null); setQuoteLoading(false); return; }
    const controller = new AbortController();
    setQuote(null); // clear the previous date range's total immediately so it can't be shown against the new night count
    setQuoteLoading(true);
    api.post(
      "/quotes",
      { apartment_id: apt.id, check_in: checkIn, check_out: checkOut, parking_requested: parkingRequested },
      { signal: controller.signal }
    )
      .then((response) => setQuote(response.data))
      .catch((error) => { if (error.code !== "ERR_CANCELED") setQuote(null); })
      .finally(() => { if (!controller.signal.aborted) setQuoteLoading(false); });
    return () => controller.abort();
  }, [apt, checkIn, checkOut, nights, parkingRequested]);

  const resumedDraftRef = useRef(false);

  const submitBookingRequest = useCallback(async (draft) => {
    const draftNights = draft.checkIn && draft.checkOut ? Math.round((new Date(draft.checkOut) - new Date(draft.checkIn)) / 86400000) : 0;
    if (!draft.checkIn || !draft.checkOut || draftNights < 1) return toast.error("Please select your check-in and check-out dates");
    if (draftNights < apt.min_nights) return toast.error(`Minimum stay is ${apt.min_nights} nights`);
    const draftConflict = unavailable.find((item) => draft.checkIn < item.check_out && draft.checkOut > item.check_in);
    if (draftConflict) return toast.error("Those dates are already booked—please pick different dates");
    setSubmitting(true);
    try { await api.post("/bookings", { apartment_id: apt.id, check_in: draft.checkIn, check_out: draft.checkOut, guests: Number(draft.guests), purpose: draft.purpose, notes: draft.notes || null, parking_requested: draft.parkingRequested }); toast.success("Stay request sent. Confirmation email is on its way."); navigate("/dashboard"); } catch (error) { toast.error(apiErrorMessage(error, "Could not send request")); } finally { setSubmitting(false); }
  }, [apt, unavailable, navigate]);

  const requestBooking = () => {
    if (!user) {
      try { sessionStorage.setItem(pendingBookingKey(id), JSON.stringify({ checkIn, checkOut, guests, purpose, notes, parkingRequested })); } catch { /* Storage can be unavailable without affecting the redirect. */ }
      toast.info("Sign in to request a stay");
      const query = searchParams.toString();
      navigate("/login", { state: { from: `/apartments/${id}${query ? `?${query}` : ""}` } });
      return;
    }
    return submitBookingRequest({ checkIn, checkOut, guests, purpose, notes, parkingRequested });
  };

  useEffect(() => {
    if (!user || !apt || !unavailableLoaded || resumedDraftRef.current) return;
    let draft = null;
    try { const raw = sessionStorage.getItem(pendingBookingKey(id)); if (raw) draft = JSON.parse(raw); } catch { draft = null; }
    if (!draft) return;
    resumedDraftRef.current = true;
    try { sessionStorage.removeItem(pendingBookingKey(id)); } catch { /* ignore */ }
    setCheckIn(draft.checkIn || "");
    setCheckOut(draft.checkOut || "");
    setGuests(draft.guests || 1);
    setPurpose(draft.purpose || "business");
    setNotes(draft.notes || "");
    setParkingRequested(!!draft.parkingRequested);
    toast.info("Continuing your stay request…");
    submitBookingRequest(draft);
  }, [user, apt, id, unavailableLoaded, submitBookingRequest]);

  if (notFound) return <div className="eh-container py-32 text-center" style={pageStyle(c)}><h1 className="mb-4 text-[24px] font-bold">Apartment not found</h1><Link to="/#stay-planner" className="btn-eh">Find a stay</Link></div>;
  if (!apt) return <div className="py-32 text-center" style={pageStyle(c)}><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: `${c.BLUE}33`, borderTopColor: c.BLUE }} /></div>;

  const saved = wishlistIds.includes(apt.id);
  const buildingContext = BUILDING_CONTEXT[apt.building_name] || `${apt.building_name} is in ${apt.neighborhood}, Philadelphia.`;
  const queryString = searchParams.toString();
  const homeOffers = [
    { icon: Armchair, title: "Fully furnished home", description: "Furniture, layout, view, and finishes are confirmed for the assigned apartment." },
    { icon: CookingPot, title: "Private kitchen", description: "A full kitchen supports short visits, extended stays, and everyday meals." },
    { icon: Wifi, title: "Wi-Fi at arrival", description: "Network details are protected inside the private arrival information." },
    { icon: KeyRound, title: "Door-enabled access", description: "Entry permissions and instructions are released only for the approved stay window." },
    { icon: Headphones, title: "Guest support", description: "Reservation and arrival updates are delivered directly by the Express Housing team." },
    { icon: Car, title: "Parking by request", description: `$${apt.parking_monthly.toLocaleString()}/month; shorter-stay parking is confirmed separately.` },
  ];
  const stayHighlights = [
    { icon: Users, title: "Room to settle in", description: `${apt.bedrooms === 0 ? "Studio" : `${apt.bedrooms} bedroom${apt.bedrooms === 1 ? "" : "s"}`} for up to ${apt.max_guests} registered guests.` },
    { icon: Building2, title: "Professionally managed", description: `A furnished Express Housing stay inside ${apt.building_name}.` },
    { icon: ShieldCheck, title: "Review before payment", description: "Dates, fees, policies, and the amount due are shown before a payment step." },
  ];
  const openGallery = (index = mainImg) => {
    setMainImg(index);
    setGalleryOpen(true);
  };

  return (
    <motion.div
      style={pageStyle(c)}
      data-testid="apartment-detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <ApartmentGallery images={apt.images} index={mainImg} onIndexChange={setMainImg} open={galleryOpen} onOpenChange={setGalleryOpen} title={apt.title} photoTour={apt.photo_tour} />
      <div className="relative left-1/2 h-[58svh] max-h-[780px] min-h-[430px] w-[100dvw] max-w-none -translate-x-1/2 overflow-hidden sm:h-[70svh] sm:min-h-[520px]" style={{ background: "#0A0A0A" }}>
        {apt.images?.length ? (
          <motion.button
            key={mainImg}
            type="button"
            onClick={() => openGallery(mainImg)}
            className="absolute inset-0 h-full w-full cursor-zoom-in overflow-hidden"
            aria-label={`Open photo gallery at photo ${mainImg + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <img src={apt.images[mainImg]} alt={`${apt.title}${apt.photo_tour?.[mainImg]?.room ? `, ${apt.photo_tour[mainImg].room}` : ""}`} className="h-full w-full object-cover" />
          </motion.button>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
            <div style={iconTileStyle("#FFFFFF", 56, 16)}><ImageIcon size={24} /></div>
            <p className="mt-4 text-[20px] font-bold text-white">{apt.building_name}</p>
            <p className="mt-2 max-w-sm text-[13px] text-white/70">Verified unit photography is coming soon.</p>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.16) 52%, rgba(10,10,10,0.42) 100%)" }} />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 md:p-6">
          <button type="button" onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border text-white" style={{ borderColor: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }} aria-label="Back"><ChevronLeft size={20} /></button>
          <button type="button" onClick={async () => { if (!user) { toast.info("Sign in to save apartments"); navigate("/login"); return; } const result = await toggleWishlist(apt.id); if (result?.saved) toast.success("Saved to your list"); }} className="flex h-11 w-11 items-center justify-center rounded-full border" style={{ borderColor: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", color: saved ? c.BLUE : "#FFFFFF" }} aria-label="Save" data-testid="detail-wishlist-btn"><Heart size={19} fill={saved ? c.BLUE : "none"} /></button>
        </div>

        {apt.photo_tour?.[mainImg]?.room && <span className="absolute left-4 top-[64px] md:left-6" style={{ ...microBadgeStyle("#FFFFFF"), background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.3)", backdropFilter: "blur(8px)" }} data-testid="photo-room-label">{apt.photo_tour[mainImg].room}</span>}

        <div className="eh-container pointer-events-none absolute inset-x-0 bottom-0 pb-10 md:pb-14">
          <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-white/80"><MapPin size={15} /> {apt.neighborhood} · {apt.building_name}</p>
          <h1 className="mt-5 max-w-4xl text-[46px] font-extrabold leading-[0.94] text-white sm:text-[60px] md:text-[76px]">{apt.title}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-semibold text-white/80">
            <span>{apt.review_count > 0 ? <><Star size={14} color={c.ORANGE} fill={c.ORANGE} className="mr-1 inline" />{apt.rating} ({apt.review_count} reviews)</> : "New Express Housing inventory"}</span>
            <span>{apt.bedrooms === 0 ? "Studio" : `${apt.bedrooms} bedroom${apt.bedrooms === 1 ? "" : "s"}`}</span>
            <span>Up to {apt.max_guests} guests</span>
          </div>
        </div>
      </div>

      <div className="eh-container pb-20 pt-6 md:pt-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16 lg:gap-y-0">
        <div className="hidden sm:block lg:col-span-7 lg:row-start-1">
          {apt.images?.length > 0 && <div className="hidden grid-cols-2 gap-3 sm:grid sm:grid-cols-4">{apt.images.map((image, index) => <button type="button" key={`${image}-${index}`} onClick={() => openGallery(index)} className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ border: `1px solid ${index === mainImg ? c.BLUE : c.BORDER}`, opacity: index === mainImg ? 1 : 0.78, "--tw-ring-color": c.BLUE }} aria-label={`Open photo ${index + 1} of ${apt.images.length} in gallery`}><img src={image} alt={`${apt.title}${apt.photo_tour?.[index]?.room ? `, ${apt.photo_tour[index].room}` : ""}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /></button>)}</div>}
        </div>

        <aside className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:self-stretch"><div className="rounded-[20px] border p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:p-7" style={{ background: c.CARD, borderColor: c.BORDER, boxShadow: isDarkMode ? "none" : "0 8px 30px rgba(0,0,0,0.08)" }}>
          <div className="mb-5 lg:hidden">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: c.BLUE }}>Ready when you are</p>
            <button type="button" className="btn-eh mt-3 flex min-h-14 w-full items-center justify-center gap-2 text-[16px]" onClick={() => bookingStartRef.current?.focus()} data-testid="mobile-book-apartment-cta">Book apartment <ArrowRight size={18} /></button>
          </div>
          {apt.listing_status === "draft" && <div className="mb-4"><ToneNotice color={c.ORANGE} testId="listing-verification-notice">Exact units, short-stay authorization, and final rates are still being verified. You can submit a no-charge availability request for the team to review.</ToneNotice></div>}
          <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: c.BLUE }}>Plan your stay</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-3"><strong className="text-[30px] font-extrabold">${Math.round(apt.nightly_rate)}<span className="text-[13px] font-medium" style={{ color: c.MUTED }}> / night</span></strong><span className="text-[13px] font-bold" style={{ color: c.BLUE }}>${apt.monthly_rate.toLocaleString()} / month</span></div><p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: c.MUTED }}>Monthly rate is prorated for 30+ nights. Taxes and cleaning appear before request.</p>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y py-4 text-[12px]" style={{ borderColor: c.BORDER, color: c.MUTED }}><span className="flex items-center gap-1.5"><BedDouble size={16} /> {apt.bedrooms === 0 ? "Studio" : `${apt.bedrooms} bedroom${apt.bedrooms === 1 ? "" : "s"}`}</span><span className="flex items-center gap-1.5"><Bath size={16} /> {apt.bathrooms ? `${apt.bathrooms} baths` : "Bath count varies"}</span><span className="flex items-center gap-1.5"><Users size={16} /> {apt.max_guests} guests</span><span className="flex items-center gap-1.5"><Ruler size={16} /> {apt.sqft ? `${apt.sqft.toLocaleString()} sqft` : "Size varies"}</span></div>

          <div className="mt-6 space-y-4" data-testid="booking-panel">
            {roomTypeOptions.length > 1 && (
              <div>
                <label className="label-eh">Room type</label>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${roomTypeOptions.length}, minmax(0, 1fr))` }} role="radiogroup" aria-label="Room type" data-testid="room-type-selector">
                  {roomTypeOptions.map((option) => {
                    const selected = option.id === apt.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => { if (!selected) navigate(`/apartments/${option.id}${queryString ? `?${queryString}` : ""}`, { replace: true }); }}
                        className="min-h-11 rounded-xl border px-3 py-2 text-[13px] font-bold"
                        style={{ borderColor: selected ? c.BLUE : c.BORDER, background: selected ? `${c.BLUE}12` : "transparent", color: selected ? c.BLUE : c.TEXT }}
                        data-testid={`room-type-option-${option.bedrooms}`}
                      >
                        {option.bedrooms === 0 ? "Studio" : `${option.bedrooms} bedroom${option.bedrooms === 1 ? "" : "s"}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3"><div><label className="label-eh">Check-in</label><input ref={bookingStartRef} type="date" min={today} className="input-eh" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} data-testid="booking-checkin" /></div><div><label className="label-eh">Check-out</label><input type="date" min={checkIn || today} className="input-eh" value={checkOut} onChange={(event) => setCheckOut(event.target.value)} data-testid="booking-checkout" /></div></div>
            {conflict && <ToneNotice color={c.RED} testId="dates-conflict-warning">Those dates overlap an existing stay ({conflict.check_in} → {conflict.check_out}). Please choose different dates.</ToneNotice>}
            {unavailable.length > 0 && <p className="text-[11px]" style={{ color: c.MUTED }} data-testid="unavailable-list"><strong>Already booked: </strong>{unavailable.map((item, index) => <span key={`${item.check_in}-${item.check_out}`}>{item.check_in} → {item.check_out}{index < unavailable.length - 1 ? " · " : ""}</span>)}</p>}
            <div className="grid grid-cols-2 gap-3"><div><label className="label-eh">Guests</label><select className="input-eh" value={guests} onChange={(event) => setGuests(event.target.value)} data-testid="booking-guests">{[...Array(apt.max_guests)].map((_, index) => <option key={index + 1} value={index + 1}>{index + 1} {index === 0 ? "guest" : "guests"}</option>)}</select></div><div><label className="label-eh">Purpose</label><select className="input-eh" value={purpose} onChange={(event) => setPurpose(event.target.value)} data-testid="booking-purpose">{PURPOSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div></div>
            <div><label className="label-eh">Notes <span style={{ color: c.MUTED }}>(optional)</span></label><textarea className="input-eh" rows={2} placeholder="Anything we should know?" value={notes} onChange={(event) => setNotes(event.target.value)} data-testid="booking-notes" /></div>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[13px]" style={{ color: c.TEXT }}><input type="checkbox" className="mt-1" checked={parkingRequested} onChange={(event) => setParkingRequested(event.target.checked)} style={{ accentColor: c.BLUE }} /><span>Request parking <span className="block text-[11px]" style={{ color: c.MUTED }}>${(apt.parking_monthly || 0).toLocaleString()}/month. Short-stay parking is confirmed separately.</span></span></label>
            {quoteLoading && <p className="text-[11px]" style={{ color: c.MUTED }}>Calculating taxes and fees…</p>}
            {quote && <div className="space-y-2 rounded-xl p-4 text-[13px]" style={{ background: c.CARD2 }} data-testid="price-breakdown"><div className="flex justify-between" style={{ color: c.MUTED }}><span>{nights} nights {quote.rate_mode === "monthly_prorated" && "(monthly rate)"}</span><span>${quote.accommodation.toLocaleString()}</span></div><div className="flex justify-between" style={{ color: c.MUTED }}><span>Cleaning</span><span>${quote.cleaning_fee.toLocaleString()}</span></div>{quote.parking_fee > 0 && <div className="flex justify-between" style={{ color: c.MUTED }}><span>Parking</span><span>${quote.parking_fee.toLocaleString()}</span></div>}<div className="flex justify-between" style={{ color: c.MUTED }}><span>Philadelphia lodging taxes {quote.tax_rate > 0 ? `(${(quote.tax_rate * 100).toFixed(1)}%)` : "(not applied)"}</span><span>${quote.taxes.toLocaleString()}</span></div><div className="flex justify-between border-t pt-2 font-bold" style={{ borderColor: c.BORDER, color: c.TEXT }}><span>Estimated total</span><span>${quote.total.toLocaleString()}</span></div>{apt.pricing_status === "provisional" && <p className="pt-1 text-[10px]" style={{ color: c.ORANGE }}>Provisional pricing—final approval required before payment.</p>}</div>}
            <button type="button" className="btn-eh w-full" onClick={requestBooking} disabled={submitting || !!conflict} data-testid="request-booking-btn">{submitting ? "Sending…" : conflict ? "Dates unavailable" : apt.accepting_reservations ? "Request to book" : "Request availability"}</button>
            <p className="text-center text-[11px]" style={{ color: c.MUTED }}>No charge yet. Payment and access are separate verified steps.</p>
          </div>
        </div></aside>

        <div className="lg:col-span-7 lg:row-start-2">
          {apt.image_scope === "building_and_model_not_assigned_unit" && <div><ToneNotice color={c.ORANGE}>These authorized photos show building amenities or model homes. They do not promise the exact layout, furniture, view, or finishes of the assigned unit.</ToneNotice></div>}

          <DetailSection id="stay-highlights" eyebrow="At a glance" title="Stay highlights" description="The essentials guests usually need before deciding whether a home fits their stay." c={c}>
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-3">
              {stayHighlights.map((item) => <FeatureCard key={item.title} {...item} color={c.BLUE} c={c} isDarkMode={isDarkMode} />)}
            </div>
          </DetailSection>

          <DetailSection id="about-this-stay" eyebrow={apt.neighborhood} title="About this stay" c={c}>
            <div className="space-y-5 text-[16px] leading-[1.75] md:text-[18px]" style={{ color: c.MUTED }}>
              <p className="font-semibold" style={{ color: c.TEXT }}>{apt.description}</p>
              <p>{buildingContext} This listing represents a managed inventory type, so the exact home is assigned after the reservation is approved.</p>
              <p>Before payment, you can review your dates, the full quote, cleaning and tax details, parking if requested, and the policies that apply to the stay.</p>
            </div>
          </DetailSection>

          <DetailSection id="home-offers" eyebrow="Inside the stay" title="What this home offers" description="Home comforts, arrival tools, and support are organized in one place so you know what happens before and after confirmation." c={c}>
            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {homeOffers.map((item) => <FeatureCard key={item.title} {...item} color={c.BLUE} c={c} isDarkMode={isDarkMode} />)}
            </div>
          </DetailSection>

          <DetailSection id="building-amenities" eyebrow="Official source" title="Verified building amenities" description={`${apt.amenities?.length || 0} amenities published by ${apt.building_name}. Availability and operating hours can change, so the building remains the source of truth.`} c={c}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {apt.amenities?.map((amenity) => (
                <div key={amenity} className="flex min-h-14 items-center gap-3 rounded-[14px] p-3" style={{ background: c.CARD, border: `1px solid ${c.BORDER}` }}>
                  <div style={iconTileStyle(c.GREEN, 36, 10)}><Check size={17} /></div>
                  <span className="text-[13px] font-semibold leading-snug" style={{ color: c.TEXT }}>{amenity}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {apt.amenities_source && <a href={apt.amenities_source} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold" style={{ color: c.BLUE }}>View official amenity source <ExternalLink size={15} /></a>}
              {apt.official_website && <a href={apt.official_website} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold" style={{ color: c.TEXT }}>Visit building website <ExternalLink size={15} /></a>}
            </div>
          </DetailSection>

          <DetailSection id="location-context" eyebrow="Philadelphia" title="Where you'll be" description="The building location is public for planning. The assigned unit number and private entry instructions remain protected until the reservation is confirmed and ready." c={c}>
            <div className="overflow-hidden" style={cardStyle(c, isDarkMode, { padding: 0, radius: 16 })}>
              <div className="flex min-h-48 items-center justify-center p-6" style={{ background: c.CARD2 }}>
                <div className="max-w-md text-center">
                  <div className="mx-auto" style={iconTileStyle(c.BLUE, 56, 16)}><MapPin size={24} /></div>
                  <p className="mt-4 text-[17px] font-bold" style={{ color: c.TEXT }}>{apt.neighborhood}, Philadelphia</p>
                  <p className="mt-2 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{buildingContext}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: c.BORDER }}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: c.MUTED }}>Public building address</p>
                  <p className="mt-1 text-[13px] font-bold" style={{ color: c.TEXT }}>{apt.address} · Philadelphia, PA</p>
                </div>
                {apt.official_website && <a href={apt.official_website} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-[13px] font-semibold" style={{ color: c.BLUE }}>Explore the building <ArrowRight size={15} /></a>}
              </div>
            </div>
          </DetailSection>

          <DetailSection id="things-to-know" eyebrow="Before you request" title="Things to know" description="Clear public policies now; private access information only after the stay is approved." c={c}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <ThingsCard icon={DoorOpen} title="Arrival & access" description="A private, scheduled arrival handoff." items={["Check-in and checkout timing is confirmed with your approved dates.", "The unit number, Door access, and entry steps appear on your private arrival page.", "Concierge or key-pickup instructions are included when the assigned building requires them."]} c={c} isDarkMode={isDarkMode} />
              <ThingsCard icon={Volume2} title="House rules" description="Protecting guests and partner communities." items={["Only registered guests may enter the apartment.", "No parties, events, or unauthorized gatherings.", "Respect building rules, neighbors, and designated quiet hours."]} c={c} isDarkMode={isDarkMode} />
              <ThingsCard icon={ReceiptText} title="Stay terms" description="The final terms are visible before payment." items={[`${apt.min_nights}-night minimum and up to ${apt.max_guests} guests.`, "Images may show official model homes or shared building amenities.", "Exact unit, final quote, and stay authorization are confirmed before payment."]} c={c} isDarkMode={isDarkMode} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-[14px] p-3" style={{ border: `1px solid ${c.BORDER}`, background: c.CARD }}><div style={iconTileStyle(c.BLUE, 36, 10)}><Clock3 size={17} /></div><span className="text-[13px] font-semibold">Timing confirmed by email</span></div>
              <div className="flex items-center gap-3 rounded-[14px] p-3" style={{ border: `1px solid ${c.BORDER}`, background: c.CARD }}><div style={iconTileStyle(c.BLUE, 36, 10)}><Ban size={17} /></div><span className="text-[13px] font-semibold">No unregistered events</span></div>
              <div className="flex items-center gap-3 rounded-[14px] p-3" style={{ border: `1px solid ${c.BORDER}`, background: c.CARD }}><div style={iconTileStyle(c.BLUE, 36, 10)}><CalendarDays size={17} /></div><span className="text-[13px] font-semibold">Flexible stay request</span></div>
            </div>
          </DetailSection>

          {apt.review_count > 0 && apt.reviews?.length > 0 && <section className="mt-14 border-t pt-10" style={{ borderColor: c.BORDER }}><div className="mb-6 flex items-center gap-3"><span className="h-0.5 w-8" style={{ background: c.BLUE }} aria-hidden="true" /><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>From guests</p></div><h2 className="mb-6 text-[22px] font-black leading-tight tracking-tight md:text-[26px]" style={{ color: c.TEXT }}>Guest reviews · {apt.rating} ({apt.review_count})</h2><div className="space-y-5">{apt.reviews.map((review) => <article key={review.id} style={cardStyle(c, isDarkMode)}><div className="flex items-center gap-3"><div style={iconTileStyle(c.BLUE, 36, 10)} className="font-bold">{review.user_name?.[0]}</div><div><p className="text-[13px] font-semibold">{review.user_name}</p><p className="text-[11px]" style={{ color: c.MUTED }}>{review.purpose} · {review.date}</p></div><div className="ml-auto flex" style={{ color: c.ORANGE }}>{[...Array(review.rating)].map((_, index) => <Star key={index} size={13} fill={c.ORANGE} />)}</div></div><p className="mt-3 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>“{review.comment}”</p></article>)}</div></section>}

          {nearbyStays.length > 0 && <DetailSection id="nearby-stays" eyebrow="More choices" title="Nearby Express Housing stays" description="Compare another bedroom type or partner building without returning to a crowded results page." c={c}>
            <div className="space-y-3">
              {nearbyStays.map((stay) => (
                <Link key={stay.id} to={`/apartments/${stay.id}${queryString ? `?${queryString}` : ""}`} className="group flex min-h-24 items-center gap-4 rounded-2xl p-3" style={{ background: c.CARD, border: `1px solid ${c.BORDER}`, color: c.TEXT }}>
                  <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl" style={{ background: c.CARD2 }}>
                    {stay.images?.[0] ? <img src={stay.images[0]} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Building2 size={20} color={c.MUTED} /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold">{stay.title}</p>
                    <p className="mt-1 text-[13px]" style={{ color: c.MUTED }}>{stay.neighborhood} · {stay.apt_type} · Up to {stay.max_guests} guests</p>
                  </div>
                  <ArrowRight size={18} color={c.BLUE} className="shrink-0" />
                </Link>
              ))}
            </div>
          </DetailSection>}
        </div>

      </div>
      </div>
    </motion.div>
  );
}
