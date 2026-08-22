import React from "react";
import { ArrowRight, BadgeCheck, Building2, CalendarDays, Clock, DollarSign, ShieldAlert } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { iconTileStyle } from "@/lib/designSystem";
import CalendarView from "./CalendarView";

const formatDate = (value) => {
  if (!value) return "Date pending";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function OverviewView({ stats, apartments, bookings, onNavigate }) {
  const { colors: c } = useTheme();
  const today = new Date().toISOString().slice(0, 10);
  const pending = bookings.filter((booking) => booking.status === "pending");
  const readinessBlockers = bookings.filter((booking) => (
    booking.status === "confirmed"
    && (booking.payment_status !== "paid" || !booking.unit_id || booking.arrival_status !== "released")
  ));
  const upcoming = bookings
    .filter((booking) => booking.status === "confirmed" && booking.check_in >= today)
    .sort((a, b) => a.check_in.localeCompare(b.check_in))
    .slice(0, 4);

  const statCards = stats
    ? [
        { icon: Clock, label: "Pending Requests", value: stats.pending, color: c.ORANGE },
        { icon: BadgeCheck, label: "Confirmed Stays", value: stats.confirmed, color: c.GREEN },
        { icon: DollarSign, label: "Booked Revenue", value: `$${stats.revenue.toLocaleString()}`, color: c.BLUE },
        { icon: Building2, label: "Active Listings", value: stats.apartments, color: c.MUTED },
      ]
    : [];

  return (
    <div data-testid="admin-overview">
      <section aria-labelledby="today-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: c.BLUE }}>Today</p>
            <h2 id="today-heading" className="mt-3 text-[30px] font-extrabold leading-tight md:text-[38px]">What needs attention.</h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed" style={{ color: c.MUTED }}>Requests, arrival readiness, and the next confirmed check-ins across the Philadelphia portfolio.</p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-2xl border p-5 md:p-6" style={{ background: c.CARD, borderColor: pending.length ? `${c.ORANGE}55` : c.BORDER }}>
            <div className="flex items-start justify-between gap-4"><div style={iconTileStyle(c.ORANGE, 44, 12)}><Clock size={19} /></div><span className="text-[34px] font-extrabold leading-none">{pending.length}</span></div>
            <h3 className="mt-6 text-[19px] font-bold">Requests waiting for review</h3>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{pending.length ? "Review dates, guest details, and inventory before confirming." : "The request queue is clear."}</p>
            <button type="button" onClick={() => onNavigate("pending")} className="mt-5 inline-flex min-h-11 items-center gap-2 text-[13px] font-bold" style={{ color: c.BLUE }}>Open pending requests <ArrowRight size={15} /></button>
          </article>

          <article className="rounded-2xl border p-5 md:p-6" style={{ background: c.CARD, borderColor: readinessBlockers.length ? `${c.RED}44` : c.BORDER }}>
            <div className="flex items-start justify-between gap-4"><div style={iconTileStyle(readinessBlockers.length ? c.RED : c.GREEN, 44, 12)}><ShieldAlert size={19} /></div><span className="text-[34px] font-extrabold leading-none">{readinessBlockers.length}</span></div>
            <h3 className="mt-6 text-[19px] font-bold">Confirmed stays needing setup</h3>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: c.MUTED }}>{readinessBlockers.length ? "Unit assignment, payment, or private arrival access is still incomplete." : "Every confirmed stay is operationally ready."}</p>
            <button type="button" onClick={() => onNavigate("confirmed")} className="mt-5 inline-flex min-h-11 items-center gap-2 text-[13px] font-bold" style={{ color: c.BLUE }}>Review confirmed stays <ArrowRight size={15} /></button>
          </article>
        </div>
      </section>

      <section className="mt-16 border-t pt-12" style={{ borderColor: c.BORDER }} aria-labelledby="portfolio-pulse-heading">
        <h2 id="portfolio-pulse-heading" className="text-[28px] font-extrabold md:text-[34px]">Portfolio pulse</h2>
        <div className="mt-7 grid grid-cols-2 border-y sm:grid-cols-4" style={{ borderColor: c.BORDER }}>
          {statCards.map((stat, index) => (
            <div key={stat.label} className={`py-6 ${index % 2 ? "pl-5" : "pr-5"} sm:px-5 sm:first:pl-0 sm:last:pr-0`} data-testid={`stat-${stat.label}`}>
              <div className="flex items-center gap-2" style={{ color: stat.color }}><stat.icon size={17} /><span className="text-[10px] font-bold uppercase tracking-[0.14em]">{stat.label}</span></div>
              <p className="mt-3 text-[27px] font-extrabold leading-none md:text-[32px]">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 border-t pt-12" style={{ borderColor: c.BORDER }} aria-labelledby="upcoming-heading">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: c.BLUE }}>Next arrivals</p><h2 id="upcoming-heading" className="mt-3 text-[28px] font-extrabold md:text-[34px]">Upcoming confirmed stays</h2></div>
          <button type="button" onClick={() => onNavigate("confirmed")} className="hidden min-h-11 items-center gap-2 text-[13px] font-bold sm:inline-flex" style={{ color: c.BLUE }}>View all <ArrowRight size={15} /></button>
        </div>
        {upcoming.length ? (
          <div className="mt-7 divide-y border-y" style={{ borderColor: c.BORDER }}>
            {upcoming.map((booking) => (
              <div key={booking.id} className="grid gap-3 py-5 sm:grid-cols-[100px_1fr_auto] sm:items-center">
                <div className="flex items-center gap-2 text-[13px] font-bold"><CalendarDays size={16} color={c.BLUE} /> {formatDate(booking.check_in)}</div>
                <div className="min-w-0"><p className="truncate text-[15px] font-bold">{booking.apartment_title}</p><p className="mt-1 text-[12px]" style={{ color: c.MUTED }}>{booking.user_name || booking.user_email} · {booking.nights} nights</p></div>
                <span className="text-[12px] font-semibold" style={{ color: booking.arrival_status === "released" ? c.GREEN : c.ORANGE }}>{booking.arrival_status === "released" ? "Arrival ready" : "Setup required"}</span>
              </div>
            ))}
          </div>
        ) : <p className="mt-7 rounded-2xl border p-6 text-[13px]" style={{ borderColor: c.BORDER, color: c.MUTED }}>No confirmed arrivals are currently scheduled.</p>}
      </section>

      <section className="mt-16 border-t pt-12" style={{ borderColor: c.BORDER }} aria-labelledby="calendar-heading">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: c.BLUE }}>Availability</p>
        <h2 id="calendar-heading" className="mt-3 text-[28px] font-extrabold md:text-[34px]">Portfolio calendar</h2>
        <CalendarView apartments={apartments} bookings={bookings} />
      </section>
    </div>
  );
}
