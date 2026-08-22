import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/App";

// Redirects to sign-in (with a return path) when logged out, or home with a
// toast when logged in as the wrong role. Shared by every role-gated page
// (admin dashboard, building-partner portal) so the redirect behavior can't
// drift between them.
export function useRoleGuard(requiredRole, deniedMessage) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    } else if (user.role !== requiredRole) {
      toast.error(deniedMessage);
      navigate("/", { replace: true });
    }
  }, [authLoading, user, navigate, location.pathname, requiredRole, deniedMessage]);

  return { user, authLoading, authorized: !authLoading && user?.role === requiredRole };
}
