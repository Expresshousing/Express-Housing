import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle, secondaryButtonStyle } from "@/lib/designSystem";
import { apiErrorMessage } from "./adminUtils";

function ComplianceRow({ building, onSaved }) {
  const { colors: c, isDarkMode } = useTheme();
  const [compliance, setCompliance] = useState(building.compliance || {});
  const [saving, setSaving] = useState(false);
  const fields = [
    ["master_lease_or_owner_permission", "Owner / lease permission"],
    ["zoning_use_permit", "Zoning / use permit"],
    ["rental_license", "Rental license"],
    ["hotel_tax_account", "Hotel tax account"],
    ["insurance_review", "Insurance review"],
  ];
  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/buildings/${building.id}/compliance`, compliance);
      toast.success(`${building.name} compliance checklist saved`);
      onSaved();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save compliance checklist"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div style={cardStyle(c, isDarkMode, { padding: 20 })}>
      <div className="flex items-center justify-between gap-3"><div><p className="font-bold">{building.name}</p><p className="text-[11px]" style={{ color: c.MUTED }}>{building.address}</p></div><button type="button" style={secondaryButtonStyle(c)} onClick={save} disabled={saving}>{saving ? "Saving" : "Save"}</button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {fields.map(([key, label]) => <label key={key}><span className="label-eh">{label}</span><select className="input-eh !py-2" value={compliance[key] || "pending"} onChange={(event) => setCompliance({ ...compliance, [key]: event.target.value })}><option value="pending">Pending</option><option value="verified">Verified</option><option value="not_applicable">Not applicable</option></select></label>)}
      </div>
    </div>
  );
}

function ChannelMappingRow({ listing, channel, onSaved }) {
  const { colors: c } = useTheme();
  const current = listing.channel_mappings?.[channel] || { status: "not_connected", listing_id: "" };
  const [status, setStatus] = useState(current.status);
  const [listingId, setListingId] = useState(current.listing_id || "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/listings/${listing.id}/channel`, { channel, status, listing_id: listingId || null });
      toast.success(`${channel === "booking_com" ? "Booking.com" : "Airbnb"} mapping saved`);
      onSaved();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save channel mapping"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <tr className="border-t text-[13px]" style={{ borderColor: c.BORDER }}>
      <td className="p-2 font-semibold">{listing.title}</td><td className="p-2">{channel === "booking_com" ? "Booking.com" : "Airbnb"}</td>
      <td className="p-2"><input className="input-eh !py-1.5 min-w-[160px]" placeholder="Paste real listing ID" value={listingId} onChange={(event) => setListingId(event.target.value)} /></td>
      <td className="p-2"><select className="input-eh !py-1.5" value={status} onChange={(event) => setStatus(event.target.value)}><option value="not_connected">Not connected</option><option value="pending">Pending</option><option value="connected">Connected</option></select></td>
      <td className="p-2 text-right"><button type="button" style={secondaryButtonStyle(c)} onClick={save} disabled={saving}>{saving ? "Saving" : "Save"}</button></td>
    </tr>
  );
}

export default function SetupView({ portfolio, onReload }) {
  const { colors: c, isDarkMode } = useTheme();
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const loadSetup = useCallback(() => api.get("/admin/setup").then((response) => {
    setItems(response.data);
    setDrafts(Object.fromEntries(response.data.map((item) => [item.key, { status: item.status, account_label: item.account_label || "", notes: item.notes || "" }])));
  }).catch(() => toast.error("Could not load integration setup")), []);
  useEffect(() => { loadSetup(); }, [loadSetup]);
  const saveItem = async (key) => {
    try {
      await api.patch(`/admin/setup/${key}`, { ...drafts[key], account_label: drafts[key].account_label || null, notes: drafts[key].notes || null });
      toast.success("Integration setup saved");
      loadSetup();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save integration setup"));
    }
  };
  if (!portfolio) return null;
  return (
    <div className="mt-6 space-y-12" data-testid="admin-setup">
      <section>
        <h3 className="text-[20px] font-bold">Service decisions</h3>
        <p className="mt-1 text-[13px]" style={{ color: c.MUTED }}>Store account labels and operating notes here—never passwords, API keys, or door codes.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
          {items.map((item) => {
            const draft = drafts[item.key] || { status: item.status, account_label: "", notes: "" };
            return <div key={item.key} style={cardStyle(c, isDarkMode, { padding: 20 })}><p className="text-[11px] font-semibold" style={{ color: c.MUTED }}>{item.category}</p><p className="mt-1 text-[17px] font-bold">{item.provider}</p><p className="mt-2 text-[13px]" style={{ color: c.MUTED }}>{item.summary}</p><p className="mt-3 text-[13px]" style={{ color: c.TEXT }}><strong>Next:</strong> {item.next_step}</p><div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2"><select className="input-eh" value={draft.status} onChange={(event) => setDrafts({ ...drafts, [item.key]: { ...draft, status: event.target.value } })}><option value="decision_required">Decision required</option><option value="account_required">Account required</option><option value="in_progress">In progress</option><option value="connected">Connected</option><option value="blocked">Blocked</option></select><input className="input-eh" placeholder="Account label (not secret)" value={draft.account_label} onChange={(event) => setDrafts({ ...drafts, [item.key]: { ...draft, account_label: event.target.value } })} /></div><textarea className="input-eh mt-2" rows={2} placeholder="Operations notes" value={draft.notes} onChange={(event) => setDrafts({ ...drafts, [item.key]: { ...draft, notes: event.target.value } })} /><button type="button" className="mt-3" style={secondaryButtonStyle(c)} onClick={() => saveItem(item.key)}>Save setup</button></div>;
          })}
        </div>
      </section>
      <section>
        <h3 className="text-[20px] font-bold">Short-stay approval checklist</h3>
        <p className="mt-1 text-[13px]" style={{ color: c.MUTED }}>These are evidence gates, not automatic legal approval. Verification must be completed before any unit is marked authorized.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">{portfolio.buildings.map((building) => <ComplianceRow key={building.id} building={building} onSaved={onReload} />)}</div>
      </section>
      <section>
        <h3 className="text-[20px] font-bold">Airbnb & Booking.com listing IDs</h3>
        <p className="mt-1 text-[13px]" style={{ color: c.MUTED }}>No IDs are invented. Paste the real external ID after each channel listing exists.</p>
        <div className="mt-5 overflow-x-auto" style={cardStyle(c, isDarkMode, { padding: 0 })}><table className="w-full"><thead><tr className="text-left text-[10px] font-extrabold uppercase tracking-[0.06em]" style={{ color: c.MUTED }}><th className="p-2">Inventory type</th><th className="p-2">Channel</th><th className="p-2">Listing ID</th><th className="p-2">Status</th><th /></tr></thead><tbody>{portfolio.listings.flatMap((listing) => ["airbnb", "booking_com"].map((channel) => <ChannelMappingRow key={`${listing.id}-${channel}`} listing={listing} channel={channel} onSaved={onReload} />))}</tbody></table></div>
      </section>
    </div>
  );
}
