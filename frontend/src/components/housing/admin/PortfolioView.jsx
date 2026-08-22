import React, { useMemo, useState } from "react";
import { Building2, CalendarDays, CheckCircle2, ChevronRight, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle, microBadgeStyle, primaryButtonStyle, secondaryButtonStyle } from "@/lib/designSystem";
import { apiErrorMessage } from "./adminUtils";

function UnitDrawer({ unit, booking, building, onClose, onSaved }) {
  const { colors: c } = useTheme();
  const [unitNumber, setUnitNumber] = useState(unit.unit_number || "");
  const [unitNumberVerified, setUnitNumberVerified] = useState(Boolean(unit.unit_number_verified));
  const [operationalStatus, setOperationalStatus] = useState(unit.operational_status);
  const [shortStayAuthorized, setShortStayAuthorized] = useState(Boolean(unit.short_stay_authorized));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/units/${unit.id}`, {
        unit_number: unitNumber || null,
        unit_number_verified: unitNumberVerified,
        operational_status: operationalStatus,
        short_stay_authorized: shortStayAuthorized,
      });
      toast.success(`${unit.internal_label} updated`);
      onSaved();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not update unit"));
    } finally {
      setSaving(false);
    }
  };

  return <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="unit-drawer-title">
    <button type="button" className="absolute inset-0 bg-black/55" onClick={onClose} aria-label="Close unit details" />
    <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l p-6 md:p-8" style={{ background: c.BG, borderColor: c.BORDER }}>
      <div className="flex items-start justify-between gap-4 border-b pb-6" style={{ borderColor: c.BORDER }}><div><p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: c.BLUE }}>{building?.name || "Express Housing"}</p><h2 id="unit-drawer-title" className="mt-3 text-[34px] font-extrabold leading-none">Unit {unitNumber || unit.internal_label}</h2><p className="mt-2 text-[13px]" style={{ color: c.MUTED }}>{unit.bedrooms} bedroom · {unit.internal_label}</p></div><button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full border" style={{ borderColor: c.BORDER }} aria-label="Close"><X size={18} /></button></div>
      {booking && <section className="mt-7 rounded-2xl border p-5" style={{ background: c.CARD, borderColor: c.BORDER }}><div className="flex items-center gap-3"><UserRound size={19} color={c.BLUE} /><div><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: c.MUTED }}>Current or upcoming stay</p><p className="mt-1 text-[18px] font-extrabold">{booking.user_name}</p></div></div><div className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 text-[13px]" style={{ borderColor: c.BORDER }}><div><p style={{ color: c.MUTED }}>Move-in</p><p className="mt-1 font-bold">{booking.check_in}</p></div><div><p style={{ color: c.MUTED }}>Move-out</p><p className="mt-1 font-bold">{booking.check_out}</p></div><div><p style={{ color: c.MUTED }}>Guests</p><p className="mt-1 font-bold">{booking.guests}</p></div><div><p style={{ color: c.MUTED }}>Arrival guide</p><p className="mt-1 font-bold capitalize">{(booking.arrival_status || "not ready").replaceAll("_", " ")}</p></div></div></section>}
      <section className="mt-8"><div className="flex items-center gap-3"><ShieldCheck size={19} color={c.BLUE} /><h3 className="text-[20px] font-extrabold">Unit operations</h3></div><p className="mt-2 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>Verify the physical unit before it is used in a guest arrival guide.</p><div className="mt-6 space-y-5"><div><label className="label-eh" htmlFor={`unit-number-${unit.id}`}>Physical unit number</label><input id={`unit-number-${unit.id}`} className="input-eh" placeholder="Candidate unit #" value={unitNumber} onChange={(e) => { setUnitNumber(e.target.value); if (e.target.value !== unit.unit_number) setUnitNumberVerified(false); }} /></div><label className="flex min-h-11 items-center gap-3 rounded-xl border p-3" style={{ borderColor: c.BORDER }}><input type="checkbox" checked={unitNumberVerified} onChange={(e) => setUnitNumberVerified(e.target.checked)} style={{ accentColor: c.BLUE }} /><span><strong className="block text-[13px]">Real number verified</strong><span className="text-[11px]" style={{ color: c.MUTED }}>Required before guest release</span></span></label><div><label className="label-eh" htmlFor={`operations-${unit.id}`}>Operational status</label><select id={`operations-${unit.id}`} className="input-eh" value={operationalStatus} onChange={(e) => setOperationalStatus(e.target.value)}><option value="setup_required">Setup required</option><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select></div><label className="flex min-h-11 items-center gap-3 rounded-xl border p-3" style={{ borderColor: c.BORDER }}><input type="checkbox" checked={shortStayAuthorized} onChange={(e) => setShortStayAuthorized(e.target.checked)} style={{ accentColor: c.BLUE }} /><span><strong className="block text-[13px]">Under 30 nights authorized</strong><span className="text-[11px]" style={{ color: c.MUTED }}>Building and compliance approval confirmed</span></span></label><button type="button" className="btn-eh w-full" onClick={save} disabled={saving}>{saving ? "Saving unit…" : "Save unit changes"}</button></div></section>
    </aside>
  </div>;
}

function ListingReadinessRow({ listing, units, onSaved }) {
  const { colors: c, isDarkMode } = useTheme();
  const [pricingStatus, setPricingStatus] = useState(listing.pricing_status);
  const [photoStatus, setPhotoStatus] = useState(listing.photo_status);
  const [complianceStatus, setComplianceStatus] = useState(listing.compliance_status);
  const [listingStatus, setListingStatus] = useState(listing.listing_status);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const requiresShortStayAuth = (listing.min_nights ?? 1) < 30;
  const readyUnits = units.filter((unit) => unit.operational_status === "active" && unit.unit_number_verified && (!requiresShortStayAuth || unit.short_stay_authorized)).length;

  const saveReadiness = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/listings/${listing.id}`, {
        pricing_status: pricingStatus,
        photo_status: photoStatus,
        compliance_status: complianceStatus,
        listing_status: listingStatus,
      });
      toast.success(`${listing.title} readiness updated`);
      onSaved();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not update listing readiness"));
    } finally {
      setSaving(false);
    }
  };

  const toggleReservations = async () => {
    setToggling(true);
    try {
      await api.patch(`/admin/listings/${listing.id}`, { accepting_reservations: !listing.accepting_reservations });
      toast.success(listing.accepting_reservations ? `${listing.title} closed to new reservations` : `${listing.title} is now open for reservations`);
      onSaved();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not update reservations"));
    } finally {
      setToggling(false);
    }
  };

  return (
    <div style={cardStyle(c, isDarkMode, { padding: 20 })} data-testid={`listing-readiness-${listing.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">{listing.title}</p>
          <p className="mt-1 text-[11px]" style={{ color: c.MUTED }}>{readyUnits} of {units.length} units ready · {listing.inventory_count ?? units.length} in inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <span style={microBadgeStyle(listing.accepting_reservations ? c.GREEN : c.MUTED)}>{listing.accepting_reservations ? "Open for reservations" : "Not accepting reservations"}</span>
          <button
            type="button"
            style={listing.accepting_reservations ? secondaryButtonStyle(c) : primaryButtonStyle(c)}
            onClick={toggleReservations}
            disabled={toggling}
            data-testid={`toggle-reservations-${listing.id}`}
          >
            {toggling ? "Saving" : listing.accepting_reservations ? "Close reservations" : "Open reservations"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-4">
        <label><span className="label-eh">Pricing</span><select className="input-eh !py-2" value={pricingStatus} onChange={(e) => setPricingStatus(e.target.value)}><option value="provisional">Provisional</option><option value="approved">Approved</option></select></label>
        <label><span className="label-eh">Photos</span><select className="input-eh !py-2" value={photoStatus} onChange={(e) => setPhotoStatus(e.target.value)}><option value="required">Required</option><option value="building_only">Building only</option><option value="verified">Verified</option></select></label>
        <label><span className="label-eh">Compliance</span><select className="input-eh !py-2" value={complianceStatus} onChange={(e) => setComplianceStatus(e.target.value)}><option value="verification_required">Verification required</option><option value="approved">Approved</option></select></label>
        <label><span className="label-eh">Listing status</span><select className="input-eh !py-2" value={listingStatus} onChange={(e) => setListingStatus(e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
      </div>
      <button type="button" className="mt-3" style={secondaryButtonStyle(c)} onClick={saveReadiness} disabled={saving} data-testid={`save-readiness-${listing.id}`}>{saving ? "Saving" : "Save readiness"}</button>
    </div>
  );
}

export default function PortfolioView({ portfolio, bookings = [], onReload }) {
  const { colors: c, isDarkMode } = useTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedUnit, setSelectedUnit] = useState(null);
  const unitBookings = useMemo(() => {
    const byUnit = new Map();
    bookings.filter((booking) => booking.unit_id && booking.status === "confirmed").forEach((booking) => {
      const existing = byUnit.get(booking.unit_id);
      if (!existing || booking.check_in < existing.check_in) byUnit.set(booking.unit_id, booking);
    });
    return byUnit;
  }, [bookings]);
  if (!portfolio) return <p className="py-12 text-center text-[13px]" style={{ color: c.MUTED }}>Portfolio data is not loaded.</p>;
  const summary = portfolio.summary;
  const today = new Date().toISOString().slice(0, 10);
  const matchesFilter = (unit) => {
    const booking = unitBookings.get(unit.id);
    const occupied = Boolean(booking && booking.check_in <= today && booking.check_out > today);
    if (filter === "occupied") return occupied;
    if (filter === "available") return !occupied && unit.operational_status === "active";
    if (filter === "arrivals") return booking?.check_in === today;
    return true;
  };
  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery = (unit, building) => {
    const booking = unitBookings.get(unit.id);
    return !normalizedQuery || [unit.internal_label, unit.unit_number, building.name, booking?.user_name, booking?.user_email].some((value) => value?.toLowerCase().includes(normalizedQuery));
  };
  const selectedBuilding = selectedUnit && portfolio.buildings.find((building) => building.id === selectedUnit.building_id);
  return (
    <div className="mt-6" data-testid="admin-portfolio">
      <section className="overflow-hidden rounded-[22px] text-white" style={{ background: "#171717" }}>
        <div className="grid md:grid-cols-[1.25fr_0.75fr]"><div className="p-7 md:p-10"><div className="flex items-center gap-3"><span className="h-0.5 w-8" style={{ background: c.BLUE }} /><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">Philadelphia collection</p></div><h2 className="mt-6 max-w-2xl text-[38px] font-extrabold leading-[0.96] md:text-[54px]">Every apartment,<br />ready at a glance.</h2><p className="mt-5 max-w-xl text-[13px] leading-relaxed text-white/60">Search the full portfolio, see occupancy and arrivals, then open one focused workspace for unit readiness and reservation details.</p></div><div className="grid grid-cols-2 border-t border-white/15 md:border-l md:border-t-0">{[["Buildings", summary.buildings], ["Units", summary.units], ["Ready", summary.ready_units], ["Verified", summary.verified_unit_numbers]].map(([label, value]) => <div key={label} className="border-b border-r border-white/15 p-6"><p className="text-[32px] font-extrabold">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">{label}</p></div>)}</div></div>
      </section>

      <section className="sticky top-20 z-20 mt-5 rounded-2xl border p-3" style={{ background: c.CARD, borderColor: c.BORDER, boxShadow: isDarkMode ? "none" : "0 8px 24px rgba(0,0,0,0.06)" }} aria-label="Unit search and filters">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center"><label className="relative min-w-0 flex-1"><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: c.MUTED }} /><span className="sr-only">Search units</span><input className="input-eh !pl-11" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guest, unit number, email, or building" /></label><div className="flex gap-1 overflow-x-auto">{[["all", "All units"], ["arrivals", "Today's arrivals"], ["occupied", "Occupied"], ["available", "Available"]].map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className="min-h-11 shrink-0 rounded-xl px-4 text-[12px] font-bold" style={filter === value ? { background: c.TEXT, color: c.BG } : { color: c.MUTED }}>{label}</button>)}</div></div>
      </section>

      <div className="mt-8 rounded-xl p-4 text-[12px] leading-relaxed" style={{ background: `${c.ORANGE}12`, border: `1px solid ${c.ORANGE}33`, color: c.TEXT }}><strong>Unit-number safety:</strong> TBD numbers are internal placeholders. Replace and verify the real number before releasing any guest arrival guide.</div>

      <div className="mt-12 space-y-16">
        {portfolio.buildings.map((building) => {
          const units = portfolio.units.filter((unit) => unit.building_id === building.id);
          const listings = portfolio.listings.filter((listing) => listing.building_id === building.id);
          const visibleUnits = units.filter((unit) => matchesFilter(unit) && matchesQuery(unit, building));
          if (visibleUnits.length === 0 && (query || filter !== "all")) return null;
          const buildingImage = listings.find((listing) => listing.images?.length)?.images?.[0];
          return (
            <section key={building.id} aria-labelledby={`building-${building.id}`}>
              <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-end">
                <div className="h-40 overflow-hidden rounded-2xl" style={{ background: c.CARD2 }}>{buildingImage ? <img src={buildingImage} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Building2 size={30} color={c.MUTED} /></div>}</div>
                <div className="border-b pb-5" style={{ borderColor: c.BORDER }}><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: c.BLUE }}>{visibleUnits.length} of {units.length} units shown</p><h3 id={`building-${building.id}`} className="mt-3 text-[30px] font-extrabold leading-none md:text-[38px]">{building.name}</h3><p className="mt-3 text-[12px]" style={{ color: c.MUTED }}>{building.address}, Philadelphia</p></div><a href={building.website} target="_blank" rel="noreferrer" className="btn-eh-outline">Official building site ↗</a></div></div>
              </div>
              <details className="mt-6 rounded-2xl border" style={{ borderColor: c.BORDER }}><summary className="cursor-pointer list-none px-5 py-4 text-[13px] font-bold">Listing readiness & reservation controls</summary><div className="space-y-3 border-t p-4" style={{ borderColor: c.BORDER }}>
                {listings.map((listing) => (
                  <ListingReadinessRow
                    key={listing.id}
                    listing={listing}
                    units={units.filter((unit) => unit.listing_id === listing.id)}
                    onSaved={onReload}
                  />
                ))}
              </div></details>
              <div className="mt-5 overflow-hidden rounded-2xl border" style={{ background: c.CARD, borderColor: c.BORDER }}>
                <div className="hidden grid-cols-[0.8fr_0.8fr_1fr_1fr_42px] gap-4 border-b px-5 py-3 text-[9px] font-bold uppercase tracking-[0.14em] md:grid" style={{ borderColor: c.BORDER, color: c.MUTED }}><span>Unit</span><span>Type</span><span>Resident / stay</span><span>Readiness</span><span /></div>
                {visibleUnits.map((unit) => { const booking = unitBookings.get(unit.id); return <button key={unit.id} type="button" onClick={() => setSelectedUnit(unit)} className="grid min-h-[76px] w-full grid-cols-[1fr_42px] items-center gap-4 border-t px-5 py-4 text-left first:border-t-0 md:grid-cols-[0.8fr_0.8fr_1fr_1fr_42px]" style={{ borderColor: c.BORDER }}><span><strong className="block text-[15px]">{unit.unit_number || unit.internal_label}</strong><span className="mt-1 block font-mono text-[10px]" style={{ color: c.MUTED }}>{unit.internal_label}</span></span><span className="hidden text-[12px] md:block">{unit.bedrooms} bedroom</span><span className="hidden md:block"><strong className="block text-[12px]">{booking?.user_name || "Available"}</strong>{booking && <span className="mt-1 flex items-center gap-1 text-[10px]" style={{ color: c.MUTED }}><CalendarDays size={11} /> {booking.check_in} → {booking.check_out}</span>}</span><span className="hidden md:flex md:flex-wrap md:gap-1.5"><span style={microBadgeStyle(unit.operational_status === "active" ? c.GREEN : c.ORANGE)}>{unit.operational_status.replaceAll("_", " ")}</span>{unit.unit_number_verified && <span style={microBadgeStyle(c.BLUE)}><CheckCircle2 size={10} className="mr-1 inline" /> verified</span>}</span><ChevronRight size={18} style={{ color: c.MUTED }} /></button>; })}
              </div>
            </section>
          );
        })}
      </div>
      {selectedUnit && <UnitDrawer unit={selectedUnit} booking={unitBookings.get(selectedUnit.id)} building={selectedBuilding} onClose={() => setSelectedUnit(null)} onSaved={async () => { await onReload(); setSelectedUnit(null); }} />}
    </div>
  );
}
