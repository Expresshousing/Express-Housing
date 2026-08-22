import React, { useState } from "react";
import { CalendarDays, Users, CheckCircle2, XCircle, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle, primaryButtonStyle, secondaryButtonStyle, statusStyle } from "@/lib/designSystem";
import { apiErrorMessage } from "./adminUtils";

function BookingOperations({ booking, portfolio, onReload }) {
  const { colors: c } = useTheme();
  const eligibleUnits = portfolio?.units?.filter((unit) => unit.listing_id === booking.apartment_id) || [];
  const [unitId, setUnitId] = useState(booking.unit_id || "");
  const [working, setWorking] = useState(false);
  const [guide, setGuide] = useState({
    building_entry_instructions: "Use the Door app invitation sent to your booking email to enter the building.",
    unit_entry_instructions: "Use your scheduled Door access at the apartment entrance.",
    concierge_instructions: "",
    parking_instructions: "",
    mail_instructions: "",
    trash_instructions: "",
    checkout_instructions: "",
    walkthrough_video_url: "",
    walkthrough_instructions: "",
    wifi_name: "",
    wifi_password: "",
    access_code: "",
    operations_ready: false,
  });

  const assign = async () => {
    setWorking(true);
    try { await api.patch(`/admin/bookings/${booking.id}/assignment`, { unit_id: unitId }); toast.success("Physical unit assigned"); await onReload(); }
    catch (error) { toast.error(apiErrorMessage(error, "Could not assign unit")); }
    finally { setWorking(false); }
  };
  const markPaid = async () => {
    setWorking(true);
    try { await api.patch(`/admin/bookings/${booking.id}/payment`, { payment_status: "paid" }); toast.success("Payment marked paid (manual preview mode)"); await onReload(); }
    catch (error) { toast.error(apiErrorMessage(error, "Could not update payment")); }
    finally { setWorking(false); }
  };
  const releaseArrival = async () => {
    setWorking(true);
    try {
      await api.put(`/admin/bookings/${booking.id}/arrival`, {
        ...guide,
        unit_id: booking.unit_id,
        wifi_password: guide.wifi_password || null,
        access_code: guide.access_code || null,
        concierge_instructions: guide.concierge_instructions || null,
        parking_instructions: guide.parking_instructions || null,
        mail_instructions: guide.mail_instructions || null,
        trash_instructions: guide.trash_instructions || null,
        checkout_instructions: guide.checkout_instructions || null,
        walkthrough_video_url: guide.walkthrough_video_url || null,
        walkthrough_instructions: guide.walkthrough_instructions || null,
        wifi_name: guide.wifi_name || null,
        door_invite_email: booking.user_email,
        release_at: new Date().toISOString(),
        release_now: true,
      });
      toast.success("Arrival details released to the authenticated guest portal");
      onReload();
    } catch (error) { toast.error(apiErrorMessage(error, "Could not release arrival details")); }
    finally { setWorking(false); }
  };

  if (!portfolio || eligibleUnits.length === 0) return null;
  const guideSections = [
    guide.building_entry_instructions,
    guide.unit_entry_instructions,
    guide.concierge_instructions,
    guide.parking_instructions,
    guide.mail_instructions,
    guide.trash_instructions,
    guide.checkout_instructions,
    guide.walkthrough_video_url,
    guide.wifi_name,
  ];
  const completedSections = guideSections.filter((value) => value?.trim()).length;
  return (
    <details className="mt-4 border-t pt-3" style={{ borderColor: c.BORDER }}>
      <summary className="cursor-pointer text-[13px] font-semibold" style={{ color: c.BLUE }}>Reservation operations</summary>
      <div className="mt-3 space-y-3 rounded-xl p-4 text-[13px]" style={{ background: c.CARD2 }}>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[220px]"><label className="label-eh">Assigned physical unit</label><select className="input-eh !py-2" value={unitId} onChange={(e) => setUnitId(e.target.value)}>{!booking.unit_id && <option value="" disabled>— Select a unit to assign —</option>}{eligibleUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.internal_label} · {unit.unit_number || "number missing"} · {unit.unit_number_verified ? "verified" : "placeholder"} · {unit.operational_status}</option>)}</select></div>
          <button className="btn-eh !py-2" onClick={assign} disabled={working || !unitId}>Assign</button>
          <button type="button" style={secondaryButtonStyle(c)} onClick={markPaid} disabled={working || booking.payment_status === "paid"}>{booking.payment_status === "paid" ? "Paid" : "Mark paid"}</button>
        </div>
        <p style={{ color: c.MUTED }}>Payment: <strong>{booking.payment_status}</strong> · Arrival: <strong>{booking.arrival_status}</strong>{booking.unit_id ? " · unit assigned" : " · unit not assigned"}</p>
        {(booking.status === "confirmed" || booking.status === "completed") && booking.payment_status === "paid" && booking.unit_id && (
          <div className="space-y-2 border-t pt-3" style={{ borderColor: c.BORDER }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-bold">Prepare secure stay guide</p><p className="mt-1 text-[11px]" style={{ color: c.MUTED }}>Guests see only completed sections after release.</p></div>
              <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: completedSections === guideSections.length ? `${c.GREEN}14` : c.CARD, color: completedSections === guideSections.length ? c.GREEN : c.MUTED, border: `1px solid ${c.BORDER}` }}>{completedSections}/{guideSections.length} sections ready</span>
            </div>
            <div><label className="label-eh">Building entry</label><textarea className="input-eh" rows={2} value={guide.building_entry_instructions} onChange={(e) => setGuide({ ...guide, building_entry_instructions: e.target.value })} placeholder="How to find and enter the building" /></div>
            <div><label className="label-eh">Apartment entry</label><textarea className="input-eh" rows={2} value={guide.unit_entry_instructions} onChange={(e) => setGuide({ ...guide, unit_entry_instructions: e.target.value })} placeholder="How to reach and enter the assigned apartment" /></div>
            <div className="rounded-xl border p-4" style={{ borderColor: c.BORDER, background: c.CARD }}>
              <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold">Apartment access video</p><p className="mt-1 text-[11px]" style={{ color: c.MUTED }}>Optional. Paste an unlisted YouTube walkthrough for this assigned apartment.</p></div>{guide.walkthrough_video_url && <a href={guide.walkthrough_video_url} target="_blank" rel="noreferrer" className="text-[12px] font-bold" style={{ color: c.BLUE }}>Preview on YouTube ↗</a>}</div>
              <div className="mt-3 space-y-3"><div><label className="label-eh" htmlFor={`walkthrough-url-${booking.id}`}>YouTube link</label><input id={`walkthrough-url-${booking.id}`} type="url" inputMode="url" className="input-eh" value={guide.walkthrough_video_url} onChange={(e) => setGuide({ ...guide, walkthrough_video_url: e.target.value })} placeholder="https://youtu.be/..." /></div><div><label className="label-eh" htmlFor={`walkthrough-notes-${booking.id}`}>Video instructions</label><textarea id={`walkthrough-notes-${booking.id}`} className="input-eh" rows={2} value={guide.walkthrough_instructions} onChange={(e) => setGuide({ ...guide, walkthrough_instructions: e.target.value })} placeholder="What the guest should notice before or after watching" /></div></div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label className="label-eh">Concierge or key pickup</label><textarea className="input-eh" rows={3} value={guide.concierge_instructions} onChange={(e) => setGuide({ ...guide, concierge_instructions: e.target.value })} placeholder="Lobby, key fob, or concierge steps" /></div>
              <div><label className="label-eh">Parking</label><textarea className="input-eh" rows={3} value={guide.parking_instructions} onChange={(e) => setGuide({ ...guide, parking_instructions: e.target.value })} placeholder="Garage entrance, space, and access" /></div>
              <div><label className="label-eh">Mail and packages</label><textarea className="input-eh" rows={3} value={guide.mail_instructions} onChange={(e) => setGuide({ ...guide, mail_instructions: e.target.value })} placeholder="Delivery address and package collection" /></div>
              <div><label className="label-eh">Trash and recycling</label><textarea className="input-eh" rows={3} value={guide.trash_instructions} onChange={(e) => setGuide({ ...guide, trash_instructions: e.target.value })} placeholder="Disposal room and building rules" /></div>
            </div>
            <div><label className="label-eh">Checkout</label><textarea className="input-eh" rows={3} value={guide.checkout_instructions} onChange={(e) => setGuide({ ...guide, checkout_instructions: e.target.value })} placeholder="Departure time, keys, trash, and final steps" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><input className="input-eh" autoComplete="off" name="guest-fallback-code" value={guide.access_code} onChange={(e) => setGuide({ ...guide, access_code: e.target.value })} placeholder="Fallback code (optional)" /><input className="input-eh" autoComplete="off" name="guest-wifi-name" value={guide.wifi_name} onChange={(e) => setGuide({ ...guide, wifi_name: e.target.value })} placeholder="Wi-Fi name" /><input type="text" className="input-eh" autoComplete="off" name="guest-wifi-password" value={guide.wifi_password} onChange={(e) => setGuide({ ...guide, wifi_password: e.target.value })} placeholder="Wi-Fi password" /></div>
            <label className="flex min-h-11 items-start gap-2"><input type="checkbox" className="mt-0.5" checked={guide.operations_ready} onChange={(e) => setGuide({ ...guide, operations_ready: e.target.checked })} style={{ accentColor: c.BLUE }} /><span>I verified cleaning, unit condition, and Door access. Release these details now.</span></label>
            <button type="button" className="btn-eh" onClick={releaseArrival} disabled={working || !guide.operations_ready}>Release arrival access</button>
          </div>
        )}
      </div>
    </details>
  );
}

export default function BookingsView({ bookings, portfolio, onReload, status = "all" }) {
  const { colors: c, isDarkMode } = useTheme();
  const [acting, setActing] = useState(null);

  const updateStatus = async (bookingId, status) => {
    setActing(bookingId + status);
    try {
      await api.patch(`/admin/bookings/${bookingId}`, { status });
      toast.success(
        status === "confirmed"
          ? "Stay approved — confirmation email sent to guest"
          : status === "cancelled"
          ? "Request declined — guest notified by email"
          : "Stay marked completed — thank-you email sent"
      );
      onReload();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Update failed"));
    } finally {
      setActing(null);
    }
  };

  const filtered = status === "all" ? bookings : bookings.filter((b) => b.status === status);

  return (
    <>
      {filtered.length === 0 ? (
        <div className="py-16 text-center" style={{ color: c.MUTED }}>
          <p className="font-semibold">No {status !== "all" ? status : ""} requests</p>
        </div>
      ) : (
        <div className="mt-2 space-y-4" data-testid="admin-bookings-list">
          {filtered.map((b) => (
            <div key={b.id} className="flex flex-col md:flex-row gap-4" style={cardStyle(c, isDarkMode)} data-testid={`admin-booking-${b.id}`}>
              <img src={b.apartment_image} alt="" className="w-full md:w-36 h-28 object-cover shrink-0 rounded-xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] font-semibold" style={{ color: c.MUTED }}>{b.neighborhood}</p>
                    <p className="font-bold">{b.apartment_title}</p>
                    {(b.user_name || b.user_email) && (
                      <p className="text-[13px] mt-0.5" style={{ color: c.MUTED }}>
                        {b.user_name} · <span>{b.user_email}</span>
                      </p>
                    )}
                  </div>
                  <span style={statusStyle(b.status, c)}>
                    {b.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-[13px] mt-2" style={{ color: c.MUTED }}>
                  <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {b.check_in} → {b.check_out} · {b.nights} nights</span>
                  <span className="flex items-center gap-1.5"><Users size={14} /> {b.guests} guests · {b.purpose}</span>
                  <span className="font-bold" style={{ color: c.TEXT }}>${b.total_price.toLocaleString()}</span>
                </div>
                {b.notes && <p className="text-[13px] mt-2 italic" style={{ color: c.MUTED }}>“{b.notes}”</p>}
                <p className="text-[11px] mt-2" style={{ color: c.MUTED }}>Payment: {b.payment_status} · Arrival: {b.arrival_status} · Source: {b.source}</p>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {b.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateStatus(b.id, "confirmed")}
                        disabled={acting === b.id + "confirmed"}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
                        style={primaryButtonStyle(c)}
                        data-testid={`approve-btn-${b.id}`}
                      >
                        <CheckCircle2 size={13} /> Approve
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "cancelled")}
                        disabled={acting === b.id + "cancelled"}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-4 py-2 disabled:opacity-50"
                        style={{ ...secondaryButtonStyle(c), color: c.RED, borderColor: `${c.RED}55`, background: `${c.RED}12` }}
                        data-testid={`decline-btn-${b.id}`}
                      >
                        <XCircle size={13} /> Decline
                      </button>
                    </>
                  )}
                  {b.status === "confirmed" && (
                    <button
                      onClick={() => updateStatus(b.id, "completed")}
                      disabled={acting === b.id + "completed"}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-4 py-2 disabled:opacity-50"
                      style={secondaryButtonStyle(c)}
                      data-testid={`complete-btn-${b.id}`}
                    >
                      <BadgeCheck size={13} /> Mark Completed
                    </button>
                  )}
                </div>
                <BookingOperations booking={b} portfolio={portfolio} onReload={onReload} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
