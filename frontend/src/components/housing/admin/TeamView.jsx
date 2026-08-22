import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle, iconTileStyle, microBadgeStyle } from "@/lib/designSystem";
import { apiErrorMessage } from "./adminUtils";

export default function TeamView({ buildings }) {
  const { colors: c, isDarkMode } = useTheme();
  const [admins, setAdmins] = useState([]);
  const [partners, setPartners] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [partnerForm, setPartnerForm] = useState({ name: "", email: "", phone: "", password: "", building_ids: [] });
  const [creating, setCreating] = useState(false);
  const [creatingPartner, setCreatingPartner] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.get("/admin/users"), api.get("/admin/partners")])
      .then(([adminResponse, partnerResponse]) => {
        setAdmins(adminResponse.data);
        setPartners(partnerResponse.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const createAdmin = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/admin/users", form);
      toast.success(`Admin account created for ${form.name} — they can now sign in at /login`);
      setForm({ name: "", email: "", password: "" });
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not create admin"));
    } finally {
      setCreating(false);
    }
  };

  const toggleBuilding = (buildingId) => {
    setPartnerForm((current) => ({
      ...current,
      building_ids: current.building_ids.includes(buildingId)
        ? current.building_ids.filter((id) => id !== buildingId)
        : [...current.building_ids, buildingId],
    }));
  };

  const createPartner = async (event) => {
    event.preventDefault();
    if (partnerForm.building_ids.length === 0) return toast.error("Choose at least one building");
    setCreatingPartner(true);
    try {
      await api.post("/admin/partners", { ...partnerForm, phone: partnerForm.phone || null });
      toast.success(`Building portal account created for ${partnerForm.name}`);
      setPartnerForm({ name: "", email: "", phone: "", password: "", building_ids: [] });
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not create building partner"));
    } finally {
      setCreatingPartner(false);
    }
  };

  return (
    <div className="mt-6 space-y-12" data-testid="admin-team">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h4 className="mb-4 border-b pb-3 text-[17px] font-bold" style={{ borderColor: c.BORDER }}>Operations admins ({admins.length})</h4>
          <div className="space-y-3">
            {admins.map((a) => (
              <div key={a.id} className="flex items-center gap-3" style={cardStyle(c, isDarkMode)} data-testid={`admin-user-${a.email}`}>
                <div className="font-bold" style={iconTileStyle(c.BLUE, 40, 12)}>{a.name?.[0]}</div>
                <div><p className="text-[13px] font-semibold">{a.name}</p><p className="text-[11px]" style={{ color: c.MUTED }}>{a.email}</p></div>
                <span className="ml-auto" style={microBadgeStyle(c.BLUE)}>Admin</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 border-b pb-3 text-[17px] font-bold" style={{ borderColor: c.BORDER }}>Add operations admin</h4>
          <p className="mb-4 text-[13px]" style={{ color: c.MUTED }}>Admins use the normal sign-in page and receive full operations access.</p>
          <form onSubmit={createAdmin} className="space-y-4" style={cardStyle(c, isDarkMode, { padding: 24, radius: 16 })} data-testid="create-admin-form">
            <div><label className="label-eh">Full Name</label><input required className="input-eh" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="create-admin-name" /></div>
            <div><label className="label-eh">Email</label><input type="email" required className="input-eh" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="create-admin-email" /></div>
            <div><label className="label-eh">Password (min 8 chars)</label><input type="password" required minLength={8} autoComplete="new-password" className="input-eh" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="create-admin-password" /></div>
            <button type="submit" className="btn-eh w-full" disabled={creating} data-testid="create-admin-submit">{creating ? "Creating..." : "Create Admin Account"}</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 border-t pt-10 lg:grid-cols-2" style={{ borderColor: c.BORDER }}>
        <div>
          <h4 className="mb-4 text-[17px] font-bold">Building portal accounts ({partners.length})</h4>
          <p className="mb-4 text-[13px]" style={{ color: c.MUTED }}>Each account is restricted to assigned buildings and never receives payment, private-note, or access-secret data.</p>
          <div className="space-y-3">
            {partners.length === 0 && <p className="rounded-[14px] border border-dashed p-5 text-[13px]" style={{ borderColor: c.BORDER, color: c.MUTED }}>No building portal accounts yet.</p>}
            {partners.map((partner) => (
              <div key={partner.id} style={cardStyle(c, isDarkMode)}>
                <div className="flex items-start justify-between gap-3"><div><p className="text-[13px] font-semibold">{partner.name}</p><p className="text-[11px]" style={{ color: c.MUTED }}>{partner.email}</p></div><span style={microBadgeStyle(c.BLUE)}>Building</span></div>
                <p className="mt-3 text-[13px]" style={{ color: c.MUTED }}>{partner.building_ids.map((id) => buildings.find((building) => building.id === id)?.name || id).join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-4 text-[17px] font-bold">Add building portal account</h4>
          <form onSubmit={createPartner} className="space-y-4" style={cardStyle(c, isDarkMode, { padding: 24, radius: 16 })} data-testid="create-partner-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="label-eh">Contact name</label><input required className="input-eh" value={partnerForm.name} onChange={(event) => setPartnerForm({ ...partnerForm, name: event.target.value })} /></div><div><label className="label-eh">Phone (optional)</label><input className="input-eh" value={partnerForm.phone} onChange={(event) => setPartnerForm({ ...partnerForm, phone: event.target.value })} /></div></div>
            <div><label className="label-eh">Email</label><input type="email" required className="input-eh" value={partnerForm.email} onChange={(event) => setPartnerForm({ ...partnerForm, email: event.target.value })} /></div>
            <div><label className="label-eh">Temporary password (min 8 chars)</label><input type="password" required minLength={8} autoComplete="new-password" className="input-eh" value={partnerForm.password} onChange={(event) => setPartnerForm({ ...partnerForm, password: event.target.value })} /></div>
            <fieldset><legend className="label-eh">Assigned buildings</legend><div className="space-y-1 rounded-xl border p-3" style={{ borderColor: c.BORDER }}>{buildings.map((building) => <label key={building.id} className="flex min-h-11 items-center gap-2 text-[13px]"><input type="checkbox" checked={partnerForm.building_ids.includes(building.id)} onChange={() => toggleBuilding(building.id)} style={{ accentColor: c.BLUE }} /> {building.name}</label>)}</div></fieldset>
            <button type="submit" className="btn-eh w-full" disabled={creatingPartner}>{creatingPartner ? "Creating..." : "Create Building Portal Account"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
