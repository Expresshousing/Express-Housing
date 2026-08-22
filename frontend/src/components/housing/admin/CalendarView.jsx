import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle, secondaryButtonStyle } from "@/lib/designSystem";

const pad = (n) => String(n).padStart(2, "0");

export default function CalendarView({ apartments, bookings }) {
  const { colors: c, isDarkMode } = useTheme();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() }; // m: 0-based
  });

  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const days = [...Array(daysInMonth)].map((_, i) => i + 1);
  const monthLabel = new Date(month.y, month.m, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  // Every non-cancelled booking occupies its dates on the calendar — pending,
  // confirmed, and completed all represent a real reservation for those
  // nights. Excluding "completed" here was the bug: as soon as a stay was
  // marked completed, its dates silently went back to looking open.
  const active = bookings.filter((b) => b.status !== "cancelled");

  const dayStatus = (aptId, day) => {
    const ds = `${month.y}-${pad(month.m + 1)}-${pad(day)}`;
    const bk = active.find((b) => b.apartment_id === aptId && b.check_in <= ds && ds < b.check_out);
    return bk ? bk.status : null;
  };

  const shift = (delta) => {
    setMonth(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  return (
    <div className="mt-6" data-testid="admin-calendar">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => shift(-1)} className="flex h-11 w-11 items-center justify-center" style={secondaryButtonStyle(c)} aria-label="Previous month" data-testid="calendar-prev">
            <ChevronLeft size={15} />
          </button>
          <p className="font-bold uppercase tracking-wider text-[13px] min-w-[150px] text-center" data-testid="calendar-month-label">{monthLabel}</p>
          <button type="button" onClick={() => shift(1)} className="flex h-11 w-11 items-center justify-center" style={secondaryButtonStyle(c)} aria-label="Next month" data-testid="calendar-next">
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-semibold" style={{ color: c.MUTED }}>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded" style={{ background: c.GREEN }} /> Booked</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded" style={{ background: c.ORANGE }} /> Pending</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded border" style={{ background: c.CARD2, borderColor: c.BORDER }} /> Open</span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto" style={cardStyle(c, isDarkMode, { padding: 0 })}>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="sticky left-0 min-w-[180px] border-b border-r p-2 text-left text-[10px] font-bold" style={{ background: c.CARD, borderColor: c.BORDER, color: c.MUTED }}>Apartment</th>
              {days.map((d) => (
                <th key={d} className="min-w-[26px] border-b p-1 text-center font-semibold" style={{ borderColor: c.BORDER, color: c.MUTED }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apartments.map((apt) => (
              <tr key={apt.id} data-testid={`calendar-row-${apt.id}`}>
                <td className="sticky left-0 max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap border-b border-r p-2 font-semibold" style={{ background: c.CARD, borderColor: c.BORDER, color: c.TEXT }}>
                  {apt.title}
                  <span className="block text-[10px] font-normal" style={{ color: c.MUTED }}>{apt.neighborhood}</span>
                </td>
                {days.map((d) => {
                  const st = dayStatus(apt.id, d);
                  return (
                    <td
                      key={d}
                      title={st ? `${st} · ${monthLabel} ${d}` : `open · ${monthLabel} ${d}`}
                      className="h-8 border-b"
                      style={{ borderColor: c.BORDER, background: st === "confirmed" || st === "completed" ? c.GREEN : st === "pending" ? c.ORANGE : c.CARD2 }}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
