import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Heart,
  MapPin,
  Menu,
  Moon,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/App";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle, iconTileStyle } from "@/lib/designSystem";
import AuthDialog from "@/components/housing/AuthDialog";

const primaryLinks = [
  { label: "Testimonials", to: "/testimonials" },
  { label: "About us", to: "/about" },
  { label: "Contact us", to: "/contact" },
  { label: "Careers", to: "/careers" },
  { label: "FAQ", to: "/faq" },
];

export default function Header() {
  const { user, logout, wishlistIds } = useAuth();
  const { colors: c, isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [heroHeight, setHeroHeight] = useState(0);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authReturnTo, setAuthReturnTo] = useState(null);

  const isHome = location.pathname === "/";
  const overlay = isHome && !scrolled && !accountOpen;
  const foreground = overlay ? "#FFFFFF" : c.TEXT;
  const secondary = overlay ? "rgba(255,255,255,0.78)" : c.MUTED;
  const accountHref = user?.role === "admin" ? "/admin" : user?.role === "building_partner" ? "/partner" : "/dashboard";
  const accountLabel = user ? user.name.split(" ")[0] : "Sign in";

  useEffect(() => {
    if (!isHome) { setHeroHeight(0); return undefined; }
    const measure = () => setHeroHeight(document.getElementById("stay-planner")?.offsetHeight || 0);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isHome, location.pathname]);

  useEffect(() => {
    // On the homepage, the hero is the full-height video tour, so the
    // overlay header should stay blended with it through the whole
    // cinematic scroll — not flip solid after the first few pixels.
    const threshold = Math.max(16, heroHeight - 96);
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [heroHeight]);

  useEffect(() => {
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const requestedMode = location.state?.authMode;
    if (requestedMode !== "login" && requestedMode !== "signup") return;
    setAuthMode(requestedMode);
    setAuthReturnTo(location.state?.from || null);
    setAuthOpen(true);
    navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null });
  }, [location.hash, location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  const dropdownSurface = cardStyle(c, isDarkMode, { padding: 8, radius: 16 });
  const closeMenus = () => {
    setAccountOpen(false);
  };

  const toggleAccount = () => {
    setAccountOpen((open) => !open);
  };

  const openAuth = (mode = "login") => {
    const requestedMode = mode === "signup" ? "signup" : "login";
    closeMenus();
    setAuthMode(requestedMode);
    setAuthReturnTo(null);
    setAuthOpen(true);
  };

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? foreground : secondary,
    fontWeight: isActive ? 800 : 700,
  });

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-normal"
        style={{
          height: 80,
          background: overlay ? "transparent" : `${c.CARD}F5`,
          color: foreground,
          borderBottom: `1px solid ${overlay ? "transparent" : c.BORDER}`,
          backdropFilter: overlay ? "none" : "blur(14px)",
          WebkitBackdropFilter: overlay ? "none" : "blur(14px)",
        }}
        data-testid="site-header"
      >
        <div className="relative mx-auto flex h-full w-full max-w-[1280px] items-center justify-between gap-5 px-4 md:px-6">
          <Link
            to="/"
            className="flex h-14 w-[148px] shrink-0 items-center leading-none md:w-[160px]"
            style={{ color: foreground }}
            data-testid="logo"
            aria-label="Express Housing home"
          >
            <span className="whitespace-nowrap text-[17px] font-extrabold tracking-[-0.03em]">Express Housing</span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary navigation">
            {primaryLinks.map((item) => (
              <NavLink key={item.label} to={item.to} className="nav-btn flex min-h-11 items-center rounded-xl px-2 text-[15px]" style={navLinkStyle}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div
            className="flex min-h-[50px] shrink-0 items-center rounded-full border p-1.5"
            style={{
              background: overlay ? "rgba(255,255,255,0.08)" : c.CARD,
              borderColor: overlay ? "rgba(255,255,255,0.44)" : c.BORDER,
            }}
          >
            <button
              type="button"
              className="nav-btn flex h-11 w-11 items-center justify-center rounded-full"
              style={{ color: foreground }}
              onClick={toggleAccount}
              aria-label={accountOpen ? "Close menu" : "Open menu"}
              aria-expanded={accountOpen}
              data-testid="mobile-menu-btn"
            >
              {accountOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            {user ? (
              <>
                <Link
                  to={accountHref}
                  className="hidden min-h-11 items-center px-2 text-[15px] font-bold sm:flex"
                  style={{ color: foreground }}
                  data-testid="header-dashboard-link"
                >
                  {accountLabel}
                </Link>
                <Link
                  to={accountHref}
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: overlay ? "#FFFFFF" : c.TEXT, color: overlay ? "#111111" : c.BG }}
                  aria-label={`Open ${accountLabel}'s account`}
                >
                  <UserRound size={22} />
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={openAuth}
                  className="hidden min-h-11 items-center px-2 text-[15px] font-bold sm:flex"
                  style={{ color: foreground }}
                  data-testid="header-login-btn"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={openAuth}
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: overlay ? "#FFFFFF" : c.TEXT, color: overlay ? "#111111" : c.BG }}
                  aria-label="Sign in"
                >
                  <UserRound size={22} />
                </button>
              </>
            )}
          </div>

          {accountOpen && (
            <nav
              className="panel-enter absolute right-4 top-[calc(100%+10px)] w-[min(330px,calc(100vw-32px))] md:right-6 lg:w-[320px]"
              style={dropdownSurface}
              data-testid="mobile-nav"
              aria-label="Account and mobile navigation"
            >
              <div className="space-y-1 lg:hidden">
                <p className="px-3 pb-1 pt-2 text-[11px] font-extrabold uppercase tracking-[0.06em]" style={{ color: c.MUTED }}>Explore</p>
                {primaryLinks.map((item) => <Link key={item.label} to={item.to} onClick={closeMenus} className="nav-btn flex min-h-11 items-center rounded-xl px-3 text-[15px] font-semibold" style={{ color: c.TEXT }}>{item.label}</Link>)}
                <div className="my-2" style={{ borderTop: `1px solid ${c.BORDER}` }} />
              </div>

              <Link to={user ? "/dashboard?tab=saved" : "/login"} onClick={closeMenus} className="nav-btn flex min-h-11 items-center justify-between rounded-xl px-3 text-[13px] font-semibold" style={{ color: c.TEXT }} data-testid="header-wishlist-btn">
                <span className="flex items-center gap-3"><Heart size={17} /> Saved apartments</span>
                {wishlistIds.length > 0 && <span className="rounded-full px-2 py-1 text-[11px] font-extrabold" style={{ background: `${c.BLUE}12`, color: c.BLUE }}>{wishlistIds.length}</span>}
              </Link>
              <Link to="/#stay-planner" onClick={closeMenus} className="nav-btn flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold" style={{ color: c.TEXT }} data-testid="header-search-btn">
                <MapPin size={17} /> Find a stay
              </Link>
              <button type="button" onClick={toggleTheme} className="nav-btn flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-[13px] font-semibold" style={{ color: c.TEXT }} aria-label={isDarkMode ? "Switch to light theme" : "Switch to dark theme"} data-testid="theme-toggle">
                <span className="flex items-center gap-3">{isDarkMode ? <Sun size={17} /> : <Moon size={17} />} {isDarkMode ? "Light appearance" : "Dark appearance"}</span>
                <span style={iconTileStyle(c.BLUE, 32, 8)}>{isDarkMode ? <Sun size={15} /> : <Moon size={15} />}</span>
              </button>

              {user ? (
                <>
                  {(user.role === "admin" || user.role === "building_partner") && (
                    <Link to={accountHref} onClick={closeMenus} className="nav-btn flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold" style={{ color: c.BLUE }} data-testid={user.role === "admin" ? "header-admin-link" : "header-partner-link"}>
                      <Building2 size={17} /> {user.role === "admin" ? "Operations" : "Building Portal"}
                    </Link>
                  )}
                  <button type="button" onClick={() => { logout(); closeMenus(); navigate("/"); }} className="nav-btn flex min-h-11 w-full items-center rounded-xl px-3 text-left text-[13px] font-semibold" style={{ color: c.MUTED }} data-testid="header-logout-btn">Logout</button>
                </>
              ) : (
                <button type="button" onClick={openAuth} className="btn-eh mt-2 w-full" data-testid="header-menu-login-btn">Sign in</button>
              )}
            </nav>
          )}
        </div>
      </header>
      {!isHome && <div aria-hidden="true" style={{ height: 80 }} />}
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} returnTo={authReturnTo} />
    </>
  );
}
