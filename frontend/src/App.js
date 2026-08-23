import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import api from "@/lib/api";
import Header from "@/components/housing/Header";
import Footer from "@/components/housing/Footer";
import HomePage from "@/components/housing/HomePage";
import ApartmentDetailPage from "@/components/housing/ApartmentDetailPage";
import DashboardPage from "@/components/housing/DashboardPage";
import AdminPage from "@/components/housing/AdminPage";
import PartnerDashboard from "@/components/housing/PartnerDashboard";
import ContactPage from "@/components/housing/ContactPage";
import FaqPage from "@/components/housing/FaqPage";
import AboutPage from "@/components/housing/AboutPage";
import TestimonialsPage from "@/components/housing/TestimonialsPage";
import LocationsPage from "@/components/housing/LocationsPage";
import CareersPage from "@/components/housing/CareersPage";
import { useTheme } from "@/context/ThemeContext";
import "@/App.css";

// ===== Auth Context =====
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);

  const refreshWishlist = useCallback(async () => {
    try {
      const res = await api.get("/wishlist/ids");
      setWishlistIds(res.data);
    } catch {
      setWishlistIds([]);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("eh_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        refreshWishlist();
      })
      .catch(() => localStorage.removeItem("eh_token"))
      .finally(() => setLoading(false));
  }, [refreshWishlist]);

  const login = (token, userData) => {
    localStorage.setItem("eh_token", token);
    setUser(userData);
    refreshWishlist();
  };

  const logout = () => {
    localStorage.removeItem("eh_token");
    setUser(null);
    setWishlistIds([]);
  };

  const toggleWishlist = async (apartmentId) => {
    if (!user) return { needAuth: true };
    const res = await api.post(`/wishlist/${apartmentId}`);
    setWishlistIds((prev) =>
      res.data.saved ? [...prev, apartmentId] : prev.filter((id) => id !== apartmentId)
    );
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, wishlistIds, toggleWishlist }}>
      {children}
    </AuthContext.Provider>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const ApartmentsRedirect = () => {
  const location = useLocation();
  return <Navigate replace to={{ pathname: "/", search: location.search, hash: "#stay-planner" }} />;
};

const AuthRedirect = ({ mode }) => {
  const location = useLocation();
  return <Navigate replace to="/" state={{ authMode: mode, from: location.state?.from }} />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeInOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/apartments" element={<ApartmentsRedirect />} />
          <Route path="/apartments/:id" element={<ApartmentDetailPage />} />
          <Route path="/login" element={<AuthRedirect mode="login" />} />
          <Route path="/signup" element={<AuthRedirect mode="signup" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/partner" element={<PartnerDashboard />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/careers" element={<CareersPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

function App() {
  const { colors: c, isDarkMode } = useTheme();
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col transition-colors" style={{ background: c.BG, color: c.TEXT, fontFamily: c.INTER }}>
          <Header />
          <main className="flex-1">
            <AnimatedRoutes />
          </main>
          <Footer />
        </div>
        <Toaster position="top-center" richColors theme={isDarkMode ? "dark" : "light"} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
