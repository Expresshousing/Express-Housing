import React, { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, ListChecks, Clock, BadgeCheck, CheckCheck, XCircle, Mail, Building2, Users, Rocket, RefreshCw, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useRoleGuard } from "@/lib/useRoleGuard";
import { useTheme } from "@/context/ThemeContext";
import { pageStyle } from "@/lib/designSystem";
import BookingsView from "./admin/BookingsView";
import EmailsView from "./admin/EmailsView";
import MessagesView from "./admin/MessagesView";
import OverviewView from "./admin/OverviewView";
import PortfolioView from "./admin/PortfolioView";
import SetupView from "./admin/SetupView";
import TeamView from "./admin/TeamView";

export default function AdminPage() {
  const { authorized } = useRoleGuard("admin", "Admin access required");
  const { colors: c, isDarkMode } = useTheme();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [emails, setEmails] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [threads, setThreads] = useState([]);
  const [view, setView] = useState("overview");
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, b, e, a, p, m] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/bookings"),
        api.get("/admin/emails"),
        api.get("/apartments"),
        api.get("/admin/portfolio"),
        api.get("/admin/support/threads"),
      ]);
      setStats(s.data);
      setBookings(b.data);
      setEmails(e.data);
      setApartments(a.data);
      setPortfolio(p.data);
      setThreads(m.data.threads || []);
    } catch {
      toast.error("Could not load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) loadAll();
  }, [authorized, loadAll]);

  if (!authorized) return null;

  const countByStatus = (status) => bookings.filter((b) => b.status === status).length;
  const unreadTotal = threads.reduce((sum, row) => sum + (row.unread || 0), 0);

  const navGroups = [
    [{ key: "overview", label: "Overview", icon: LayoutDashboard }],
    [
      { key: "all", label: "All", icon: ListChecks, count: bookings.length },
      { key: "pending", label: "Pending", icon: Clock, count: countByStatus("pending") },
      { key: "confirmed", label: "Confirmed", icon: BadgeCheck, count: countByStatus("confirmed") },
      { key: "completed", label: "Completed", icon: CheckCheck, count: countByStatus("completed") },
      { key: "cancelled", label: "Cancelled", icon: XCircle, count: countByStatus("cancelled") },
    ],
    [
      { key: "messages", label: "Messages", icon: MessageSquare, count: threads.length, badge: unreadTotal },
      { key: "emails", label: "Sent Emails", icon: Mail, count: emails.length },
      { key: "portfolio", label: "Portfolio", icon: Building2, count: portfolio?.summary?.units ?? "…" },
      { key: "team", label: "Team", icon: Users },
      { key: "setup", label: "Launch Setup", icon: Rocket },
    ],
  ];

  const viewComponents = {
    overview: <OverviewView stats={stats} apartments={apartments} bookings={bookings} onNavigate={setView} />,
    all: <BookingsView status="all" bookings={bookings} portfolio={portfolio} onReload={loadAll} />,
    pending: <BookingsView status="pending" bookings={bookings} portfolio={portfolio} onReload={loadAll} />,
    confirmed: <BookingsView status="confirmed" bookings={bookings} portfolio={portfolio} onReload={loadAll} />,
    completed: <BookingsView status="completed" bookings={bookings} portfolio={portfolio} onReload={loadAll} />,
    cancelled: <BookingsView status="cancelled" bookings={bookings} portfolio={portfolio} onReload={loadAll} />,
    messages: <MessagesView threads={threads} onReload={loadAll} />,
    emails: <EmailsView emails={emails} />,
    portfolio: <PortfolioView portfolio={portfolio} bookings={bookings} onReload={loadAll} />,
    team: <TeamView buildings={portfolio?.buildings || []} />,
    setup: <SetupView portfolio={portfolio} onReload={loadAll} />,
  };

  const activeLabel = navGroups.flat().find((item) => item.key === view)?.label || "Overview";

  return (
    <div className="w-full pb-20 pt-6 md:pt-10" style={pageStyle(c)} data-testid="admin-dashboard">
      <div className="eh-container flex flex-col items-start gap-8 md:flex-row lg:gap-12">
        <nav
          className="flex w-full shrink-0 gap-1 overflow-x-auto rounded-2xl border p-2 md:sticky md:top-24 md:w-64 md:flex-col md:overflow-visible md:p-3"
          style={{ background: c.CARD, borderColor: c.BORDER, boxShadow: isDarkMode ? "none" : "0 2px 12px rgba(0,0,0,0.05)" }}
          data-testid="admin-sidebar"
        >
          <div className="hidden px-3 pb-5 pt-3 md:block">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: c.BLUE }}>Express Housing</p>
            <p className="mt-2 text-[22px] font-extrabold leading-none" style={{ color: c.TEXT }}>Operations</p>
            <p className="mt-2 text-[12px]" style={{ color: c.MUTED }}>Philadelphia portfolio</p>
          </div>
          {navGroups.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {groupIndex > 0 && <div className="hidden md:block my-1.5 border-t" style={{ borderColor: c.BORDER }} />}
              {group.map(({ key, label, icon: Icon, count, badge }) => {
                const active = view === key;
                return (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors md:whitespace-normal"
                    style={active ? { background: c.TEXT, color: c.BG } : { color: c.MUTED }}
                    data-testid={`admin-view-${key}`}
                  >
                    <Icon size={17} />
                    <span className="flex-1 text-left">{label}</span>
                    {badge > 0 && (
                      <span
                        className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                        style={{ background: "#DC2626", color: "#FFFFFF" }}
                        data-testid={`admin-unread-${key}`}
                        aria-label={`${badge} unread messages`}
                      >
                        {badge}
                      </span>
                    )}
                    {count !== undefined && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                        style={active ? { background: c.BLUE, color: "#FFFFFF" } : { background: c.CARD2, color: c.MUTED }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        <div className="min-w-0 flex-1" data-testid="admin-panel">
          <header className="mb-10 flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-end sm:justify-between" style={{ borderColor: c.BORDER }}>
            <div>
              <div className="flex items-center gap-3">
                <span className="h-0.5 w-8" style={{ background: c.BLUE }} aria-hidden="true" />
                <p className="text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: c.BLUE }}>Admin workspace</p>
              </div>
              <h1 className="mt-5 text-[42px] font-extrabold leading-[0.96] md:text-[58px]" style={{ color: c.TEXT }}>{activeLabel}</h1>
              <p className="mt-4 max-w-xl text-[14px] leading-relaxed" style={{ color: c.MUTED }}>
                {view === "overview" ? "See what needs attention, what is arriving next, and where the portfolio is blocked." : "Manage this part of the Express Housing operation without losing the wider portfolio context."}
              </p>
            </div>
            <button type="button" onClick={loadAll} className="btn-eh-outline shrink-0 gap-2" disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </header>
          {loading && !stats ? (
            <div className="py-20 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-t-transparent rounded-full mx-auto" style={{ borderColor: c.BLUE, borderTopColor: "transparent" }} />
            </div>
          ) : (
            viewComponents[view]
          )}
        </div>
      </div>
    </div>
  );
}
