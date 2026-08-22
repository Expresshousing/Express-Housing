import React, { useEffect, useMemo, useState } from "react";
import { Building2, CalendarDays, ChevronRight, Mail, Phone, Search, ShieldCheck, UserRound, Users, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { apiErrorMessage } from "@/lib/apiError";
import { useRoleGuard } from "@/lib/useRoleGuard";
import { useTheme } from "@/context/ThemeContext";
import { iconTileStyle, microBadgeStyle, pageStyle } from "@/lib/designSystem";

const todayIso = () => new Date().toISOString().slice(0, 10);

function normalizePartnerData(payload = {}) {
  const buildings = Array.isArray(payload.buildings) ? payload.buildings : [];
  const bookings = Array.isArray(payload.bookings) ? payload.bookings : [];
  const fallbackUnits = bookings.filter((booking) => booking.unit_id && booking.unit_assignment).map((booking) => ({
    id: booking.unit_id,
    building_id: booking.building_id,
    internal_label: booking.unit_assignment.internal_label,
    unit_number: booking.unit_assignment.unit_number || booking.unit_assignment.candidate_unit_number,
    unit_number_verified: Boolean(booking.unit_assignment.verified),
  }));
  const units = Array.isArray(payload.units) ? payload.units : Array.from(new Map(fallbackUnits.map((unit) => [unit.id, unit])).values());
  return { buildings, units, bookings };
}

function ReservationDrawer({ unit, booking, building, onClose, c }) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="reservation-title">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close reservation details" />
      <aside className="relative h-full w-full max-w-[540px] overflow-y-auto border-l p-6 md:p-8" style={{ background: c.BG, borderColor: c.BORDER }}>
        <div className="flex items-start justify-between gap-4 border-b pb-6" style={{ borderColor: c.BORDER }}>
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: c.BLUE }}>Reservation details</p><h2 id="reservation-title" className="mt-3 text-[34px] font-extrabold leading-none">Unit {unit.unit_number || unit.internal_label}</h2><p className="mt-2 text-[12px]" style={{ color: c.MUTED }}>{building?.name} · {unit.internal_label}</p></div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: c.BORDER }} aria-label="Close"><X size={18} /></button>
        </div>
        {booking ? <>
          <section className="mt-7 rounded-2xl border p-5" style={{ background: c.CARD, borderColor: c.BORDER }}><div className="flex items-center gap-3"><div style={iconTileStyle(c.BLUE, 44, 12)}><UserRound size={18} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: c.MUTED }}>Primary guest</p><p className="mt-1 text-[19px] font-extrabold">{booking.user_name || "Guest name pending"}</p></div></div><div className="mt-5 space-y-3 border-t pt-4 text-[13px]" style={{ borderColor: c.BORDER, color: c.MUTED }}><a href={`mailto:${booking.user_email}`} className="flex min-h-11 items-center gap-2"><Mail size={15} /> {booking.user_email}</a>{booking.user_phone && <a href={`tel:${booking.user_phone}`} className="flex min-h-11 items-center gap-2"><Phone size={15} /> {booking.user_phone}</a>}</div></section>
          <section className="mt-5 rounded-2xl border p-5" style={{ borderColor: c.BORDER }}><h3 className="text-[17px] font-extrabold">Stay information</h3><dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-6 text-[13px]"><div><dt style={{ color: c.MUTED }}>Move-in</dt><dd className="mt-1 font-bold">{booking.check_in}</dd></div><div><dt style={{ color: c.MUTED }}>Move-out</dt><dd className="mt-1 font-bold">{booking.check_out}</dd></div><div><dt style={{ color: c.MUTED }}>Registered guests</dt><dd className="mt-1 font-bold">{booking.guests}</dd></div><div><dt style={{ color: c.MUTED }}>Booking source</dt><dd className="mt-1 font-bold capitalize">{booking.source?.replaceAll("_", " ")}</dd></div><div><dt style={{ color: c.MUTED }}>Reservation</dt><dd className="mt-1 font-bold capitalize">{booking.status}</dd></div><div><dt style={{ color: c.MUTED }}>Arrival guide</dt><dd className="mt-1 font-bold capitalize">{(booking.arrival_status || "not_ready").replaceAll("_", " ")}</dd></div></dl></section>
        </> : <div className="mt-8 rounded-2xl border p-6" style={{ background: c.CARD2, borderColor: c.BORDER }}><p className="text-[17px] font-extrabold">No active reservation</p><p className="mt-2 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>This unit is currently shown as unoccupied. No guest contact or stay information is available.</p></div>}
        <div className="mt-8 flex items-start gap-3 border-t pt-6" style={{ borderColor: c.BORDER }}><ShieldCheck size={18} className="mt-0.5 shrink-0" color={c.GREEN} /><p className="text-[11px] leading-relaxed" style={{ color: c.MUTED }}>This building-scoped view intentionally excludes payment information, private notes, access codes, Wi-Fi credentials, and the guest’s stay purpose.</p></div>
      </aside>
    </div>
  );
}

export default function PartnerDashboard() {
  const { authorized } = useRoleGuard("building_partner", "Building partner access required");
  const { colors: c, isDarkMode } = useTheme();
  const [data, setData] = useState({ buildings: [], units: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("arrivals");
  const [query, setQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState(null);

  useEffect(() => {
    if (!authorized) return;
    api.get("/partner/summary").then((response) => setData(normalizePartnerData(response.data))).catch((error) => toast.error(apiErrorMessage(error, "Could not load building records"))).finally(() => setLoading(false));
  }, [authorized]);

  const buildingMap = useMemo(() => Object.fromEntries(data.buildings.map((building) => [building.id, building])), [data.buildings]);
  const bookingByUnit = useMemo(() => {
    const result = new Map();
    const currentDate = todayIso();
    const rank = (booking) => booking.check_in <= currentDate && booking.check_out > currentDate ? 0 : booking.check_in > currentDate ? 1 : 2;
    data.bookings.filter((booking) => booking.unit_id && booking.status === "confirmed").forEach((booking) => {
      const current = result.get(booking.unit_id);
      if (!current || rank(booking) < rank(current) || (rank(booking) === 1 && booking.check_in < current.check_in) || (rank(booking) === 2 && booking.check_out > current.check_out)) result.set(booking.unit_id, booking);
    });
    return result;
  }, [data.bookings]);
  const today = todayIso();
  const occupied = (booking) => Boolean(booking && booking.check_in <= today && booking.check_out > today);
  const counts = {
    arrivals: data.units.filter((unit) => bookingByUnit.get(unit.id)?.check_in === today).length,
    occupied: data.units.filter((unit) => occupied(bookingByUnit.get(unit.id))).length,
    unoccupied: data.units.filter((unit) => !occupied(bookingByUnit.get(unit.id))).length,
  };
  const normalizedQuery = query.trim().toLowerCase();
  const visibleUnits = data.units.filter((unit) => {
    const booking = bookingByUnit.get(unit.id);
    if (filter === "arrivals" && booking?.check_in !== today) return false;
    if (filter === "occupied" && !occupied(booking)) return false;
    if (filter === "unoccupied" && occupied(booking)) return false;
    return !normalizedQuery || [unit.unit_number, unit.internal_label, booking?.user_name, booking?.user_email, buildingMap[unit.building_id]?.name].some((value) => value?.toLowerCase().includes(normalizedQuery));
  });
  if (!authorized) return null;
  const selectedBooking = selectedUnit ? bookingByUnit.get(selectedUnit.id) : null;
  const selectedBuilding = selectedUnit ? buildingMap[selectedUnit.building_id] : null;

  return (
    <main className="min-h-screen py-8 md:py-12" style={pageStyle(c)} data-testid="partner-dashboard">
      <div className="eh-container">
        <header className="border-b pb-8" style={{ borderColor: c.BORDER }}><div className="flex flex-wrap items-center justify-between gap-5"><div><p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>Express Housing · Building portal</p><h1 className="mt-4 text-[38px] font-extrabold leading-[0.96] md:text-[56px]">Units overview</h1><p className="mt-4 max-w-2xl text-[13px] leading-relaxed" style={{ color: c.MUTED }}>Front-desk visibility for arrivals, occupied apartments, and available units across your assigned building.</p></div><div className="flex items-center gap-3 rounded-2xl border p-3 pr-5" style={{ background: c.CARD, borderColor: c.BORDER }}><div style={iconTileStyle(c.BLUE, 44, 12)}><Building2 size={19} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: c.MUTED }}>Assigned properties</p><p className="mt-1 text-[14px] font-extrabold">{data.buildings.map((building) => building.name).join(" · ") || "Loading…"}</p></div></div></div></header>
        <section className="mt-8 rounded-[20px] border p-4 md:p-6" style={{ background: c.CARD, borderColor: c.BORDER, boxShadow: isDarkMode ? "none" : "0 10px 34px rgba(0,0,0,0.06)" }}>
          <label className="relative block"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: c.MUTED }} /><span className="sr-only">Search units and guests</span><input className="input-eh !pl-12" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by guest, unit number, email, internal name, or building" /></label>
          <div className="mt-5 flex gap-2 overflow-x-auto" role="group" aria-label="Unit occupancy filters">{[["arrivals", "Today's move-ins"], ["occupied", "Occupied"], ["unoccupied", "Unoccupied"]].map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className="min-h-11 shrink-0 rounded-full border px-4 text-[12px] font-bold" style={filter === value ? { background: c.TEXT, color: c.BG, borderColor: c.TEXT } : { background: c.CARD2, color: c.MUTED, borderColor: c.BORDER }}>{label} <span className="ml-1 opacity-65">{counts[value]}</span></button>)}</div>
          <div className="mt-7 overflow-hidden rounded-2xl border" style={{ borderColor: c.BORDER }}>
            <div className="hidden grid-cols-[0.7fr_1.25fr_1fr_44px] gap-4 border-b px-5 py-3 text-[9px] font-bold uppercase tracking-[0.15em] md:grid" style={{ background: c.CARD2, borderColor: c.BORDER, color: c.MUTED }}><span>Unit</span><span>Resident / company</span><span>Stay</span><span /></div>
            {loading ? <div className="py-16 text-center text-[13px]" style={{ color: c.MUTED }}>Loading unit records…</div> : visibleUnits.length === 0 ? <div className="py-16 text-center"><p className="text-[16px] font-extrabold">No units match this view</p><p className="mt-2 text-[12px]" style={{ color: c.MUTED }}>Try another filter or search term.</p></div> : visibleUnits.map((unit) => { const booking = bookingByUnit.get(unit.id); return <button key={unit.id} type="button" onClick={() => setSelectedUnit(unit)} className="grid min-h-[78px] w-full grid-cols-[1fr_40px] items-center gap-4 border-t px-5 py-4 text-left first:border-t-0 md:grid-cols-[0.7fr_1.25fr_1fr_44px]" style={{ borderColor: c.BORDER }} data-testid={`partner-unit-${unit.id}`}><span><strong className="block text-[16px]">{unit.unit_number || "Pending"}</strong><span className="mt-1 block font-mono text-[9px]" style={{ color: c.MUTED }}>{unit.internal_label}</span></span><span className="hidden md:block"><strong className="block text-[13px]">{booking?.user_name || "—"}</strong>{booking?.user_email && <span className="mt-1 block text-[10px]" style={{ color: c.MUTED }}>{booking.user_email}</span>}</span><span className="hidden md:block">{booking ? <><span className="flex items-center gap-1.5 text-[11px]" style={{ color: c.MUTED }}><CalendarDays size={13} /> {booking.check_in} → {booking.check_out}</span><span className="mt-2 inline-block" style={microBadgeStyle(occupied(booking) ? c.GREEN : c.BLUE)}>{occupied(booking) ? "Occupied" : "Arrival scheduled"}</span></> : <span style={microBadgeStyle(c.MUTED)}>Unoccupied</span>}</span><ChevronRight size={18} style={{ color: c.MUTED }} /></button>; })}
          </div>
        </section>
        <footer className="mt-7 flex flex-col gap-4 border-t pt-6 text-[11px] leading-relaxed sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: c.BORDER, color: c.MUTED }}><p className="flex items-center gap-2"><ShieldCheck size={15} color={c.GREEN} /> Building-scoped, minimum-necessary guest information.</p><p className="flex items-center gap-2"><Users size={15} /> {data.bookings.filter((booking) => !booking.unit_id && booking.status === "confirmed").length} confirmed stay(s) awaiting unit assignment.</p></footer>
      </div>
      {selectedUnit && <ReservationDrawer unit={selectedUnit} booking={selectedBooking} building={selectedBuilding} onClose={() => setSelectedUnit(null)} c={c} />}
    </main>
  );
}
