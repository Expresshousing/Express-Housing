import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart, BedDouble, Bath, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/App";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle, microBadgeStyle } from "@/lib/designSystem";

export default function ApartmentCard({ apartment }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { wishlistIds, toggleWishlist, user } = useAuth();
  const { colors: c, isDarkMode } = useTheme();
  const [imgIdx, setImgIdx] = useState(0);
  const saved = wishlistIds.includes(apartment.id);

  const handleWishlist = async (event) => {
    event.stopPropagation();
    if (!user) { toast.info("Sign in to save apartments"); navigate("/login"); return; }
    const result = await toggleWishlist(apartment.id);
    if (result?.saved) toast.success("Saved to your list");
  };

  const goDetail = (event) => {
    event?.stopPropagation();
    const current = new URLSearchParams(location.search);
    const bookingContext = new URLSearchParams();
    ["check_in", "check_out", "guests"].forEach((key) => { const value = current.get(key); if (value) bookingContext.set(key, value); });
    const query = bookingContext.toString();
    navigate(`/apartments/${apartment.id}${query ? `?${query}` : ""}`);
  };

  return (
    <article
      className="group cursor-pointer overflow-hidden stagger-item"
      style={cardStyle(c, isDarkMode, { padding: 0, radius: 14 })}
      onClick={goDetail}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") goDetail(event); }}
      tabIndex={0}
      role="link"
      data-card-focusable
      data-testid={`apartment-card-${apartment.id}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: c.CARD2 }} onMouseEnter={() => apartment.images?.length > 1 && setImgIdx(1)} onMouseLeave={() => setImgIdx(0)}>
        {apartment.images?.length ? <img src={apartment.images[imgIdx] || apartment.images[0]} alt={apartment.title} className="h-full w-full object-cover group-hover:scale-[1.02]" style={{ transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)" }} loading="lazy" /> : (
          <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center" style={{ background: c.CARD2, color: c.TEXT }}><p className="text-[11px] font-semibold" style={{ color: c.MUTED }}>Philadelphia</p><p className="mt-2 text-[20px] font-bold">{apartment.building_name}</p><p className="mt-3 text-[13px]" style={{ color: c.MUTED }}>Verified unit photography coming soon</p></div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {apartment.is_new && <span style={microBadgeStyle(c.TEXT)}>New</span>}
          {apartment.is_featured && <span style={microBadgeStyle(c.BLUE)}>Featured</span>}
          {apartment.listing_status === "draft" && <span style={microBadgeStyle(c.ORANGE)}>Preview</span>}
        </div>
        <button type="button" onClick={handleWishlist} onKeyDown={(event) => event.stopPropagation()} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: c.CARD, color: saved ? c.BLUE : c.TEXT, border: `1px solid ${c.BORDER}`, boxShadow: isDarkMode ? "none" : "0 2px 8px rgba(0,0,0,0.04)" }} aria-label={saved ? "Remove saved apartment" : "Save apartment"} data-testid={`wishlist-btn-${apartment.id}`}>
          <Heart size={18} fill={saved ? c.BLUE : "none"} />
        </button>
      </div>

      <div className="p-4">
        <p className="text-[11px] font-semibold" style={{ color: c.MUTED }}>{apartment.neighborhood} · {apartment.building_name}</p>
        <h3 className="mt-1 line-clamp-1 text-[17px] font-bold" style={{ color: c.TEXT }}>{apartment.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px]" style={{ color: c.MUTED }}>
          <span className="flex items-center gap-1"><BedDouble size={15} /> {apartment.bedrooms === 0 ? "Studio" : `${apartment.bedrooms} bd`}</span>
          <span className="flex items-center gap-1"><Bath size={15} /> {apartment.bathrooms ? `${apartment.bathrooms} ba` : "Bath varies"}</span>
          <span className="flex items-center gap-1"><Users size={15} /> {apartment.max_guests}</span>
        </div>
        <div className="mt-3 flex items-baseline justify-between gap-3"><p><strong className="text-[17px] font-bold">${Math.round(apartment.nightly_rate)}</strong><span className="text-[13px]" style={{ color: c.MUTED }}> / night</span></p><span className="text-[13px] font-semibold" style={{ color: c.BLUE }}>${apartment.monthly_rate.toLocaleString()} / mo</span></div>
        {apartment.inventory_count > 1 && <p className="mt-2 text-[11px]" style={{ color: c.MUTED }}>{apartment.inventory_count} homes in this inventory type</p>}
        {apartment.image_scope === "building_and_model_not_assigned_unit" && <p className="mt-2 text-[11px]" style={{ color: c.ORANGE }}>Building/model imagery—not the assigned unit.</p>}
      </div>
    </article>
  );
}
