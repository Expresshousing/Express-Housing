import React, { useEffect, useId, useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/App";
import { apiErrorMessage } from "@/lib/apiError";
import { useTheme } from "@/context/ThemeContext";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { inputStyle, primaryButtonStyle } from "@/lib/designSystem";

const modes = [
  { value: "login", label: "Sign in" },
  { value: "signup", label: "Create account" },
];

const roleDestination = (role) => {
  if (role === "admin") return "/admin";
  if (role === "building_partner") return "/partner";
  return "/dashboard";
};

export default function AuthSwitch({
  initialMode = "login",
  onAuthenticated,
  onModeChange,
  className,
  testIdPrefix = "",
}) {
  const { colors: c, isDarkMode } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();
  const instanceId = useId().replace(/:/g, "");
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const id = (field) => `${instanceId}-${mode}-${field}`;
  const testId = (part) => testIdPrefix ? `${testIdPrefix}-${part}` : part;

  const changeMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    onModeChange?.(nextMode);
  };

  const finishAuthentication = (response, firstName, activeMode) => {
    const user = response.data.user;
    const destination = roleDestination(user.role);
    login(response.data.access_token, user);
    toast.success(`Welcome${activeMode === "login" ? " back" : ""}, ${firstName}!`);
    if (onAuthenticated) onAuthenticated(user, destination);
    else navigate(destination);
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      finishAuthentication(response, response.data.user.name.split(" ")[0], "login");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const submitSignup = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/signup", {
        name,
        email,
        password,
        phone: phone || null,
      });
      finishAuthentication(response, name.trim().split(" ")[0], "signup");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Signup failed"));
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    ...inputStyle(c),
    minHeight: 52,
    paddingLeft: 46,
    paddingRight: 48,
    background: c.INPUT_BG,
  };

  const labelStyle = {
    color: c.TEXT,
    fontFamily: c.INTER,
    fontSize: 13,
    fontWeight: 700,
  };

  const renderField = ({
    field,
    label,
    type = "text",
    value,
    onChange,
    autoComplete,
    placeholder,
    icon: Icon,
    required = true,
    first = false,
    optional = false,
    minLength,
    allowVisibility = false,
  }) => (
    <div className="space-y-2">
      <label htmlFor={id(field)} style={labelStyle}>
        {label}
        {optional && <span className="ml-1 font-medium" style={{ color: c.MUTED }}>(optional)</span>}
      </label>
      <div className="relative">
        <Icon
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          style={{ color: c.MUTED }}
        />
        <input
          id={id(field)}
          type={allowVisibility && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          style={fieldStyle}
          data-auth-first={first ? "true" : undefined}
          data-testid={testId(`${mode}-${field}`)}
        />
        {allowVisibility && (
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl"
            style={{ color: c.MUTED }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("w-full", mode === "login" && "sm:justify-center", className)} data-testid={testId("auth-switch")}>
      <div className="mb-8 pr-12">
        <div className="flex items-center gap-3">
          <span className="h-0.5 w-6" style={{ background: c.BLUE }} aria-hidden="true" />
          <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: c.BLUE }}>Express Housing</p>
        </div>
        <h1 className="mt-5 text-[34px] font-extrabold leading-[0.98] sm:text-[40px]" style={{ color: c.TEXT }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-4 max-w-md text-[14px] leading-relaxed" style={{ color: c.MUTED }}>
          {mode === "login"
            ? "Access your reservations and private arrival details."
            : "Keep your stays, payments, and arrival details together."}
        </p>
      </div>

      <div
        className="mb-7 grid grid-cols-2 gap-1 rounded-xl p-1"
        role="tablist"
        aria-label="Account access"
        style={{ background: c.CARD2, border: `1px solid ${c.BORDER}` }}
      >
        {modes.map((tab) => {
          const active = mode === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => changeMode(tab.value)}
              className="relative min-h-11 rounded-lg px-3 text-[15px] font-bold"
              style={{
                background: active ? c.CARD : "transparent",
                color: active ? c.TEXT : c.MUTED,
                border: `1px solid ${active ? c.BORDER : "transparent"}`,
                boxShadow: active && !isDarkMode ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
              }}
              data-testid={testId(`${tab.value}-tab`)}
            >
              {tab.label}
              {active && (
                <span
                  className="absolute inset-x-5 -bottom-px h-0.5 rounded-full"
                  style={{ background: c.BLUE }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {mode === "login" ? (
        <form onSubmit={submitLogin} className="space-y-5" data-testid={testId("login-form")}>
          {renderField({ field: "email", label: "Email address", type: "email", value: email, onChange: (event) => setEmail(event.target.value), autoComplete: "email", placeholder: "you@example.com", icon: Mail, first: true })}
          {renderField({ field: "password", label: "Password", type: "password", value: password, onChange: (event) => setPassword(event.target.value), autoComplete: "current-password", placeholder: "Enter your password", icon: LockKeyhole, allowVisibility: true })}
          <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60" style={primaryButtonStyle(c, { padding: "14px 20px", radius: 12 })} disabled={loading} data-testid={testId("login-submit")}>
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>
      ) : (
        <form onSubmit={submitSignup} className="space-y-5" data-testid={testId("signup-form")}>
          {renderField({ field: "name", label: "Full name", value: name, onChange: (event) => setName(event.target.value), autoComplete: "name", placeholder: "Your full name", icon: UserRound, first: true })}
          {renderField({ field: "email", label: "Email address", type: "email", value: email, onChange: (event) => setEmail(event.target.value), autoComplete: "email", placeholder: "you@example.com", icon: Mail })}
          {renderField({ field: "phone", label: "Phone", type: "tel", value: phone, onChange: (event) => setPhone(event.target.value), autoComplete: "tel", placeholder: "+1 (215) 555-0123", icon: Phone, required: false, optional: true })}
          {renderField({ field: "password", label: "Password", type: "password", value: password, onChange: (event) => setPassword(event.target.value), autoComplete: "new-password", placeholder: "At least 8 characters", icon: LockKeyhole, minLength: 8, allowVisibility: true })}
          {renderField({ field: "confirm-password", label: "Confirm password", type: showPassword ? "text" : "password", value: confirmPassword, onChange: (event) => setConfirmPassword(event.target.value), autoComplete: "new-password", placeholder: "Enter it again", icon: LockKeyhole })}
          <p className="text-[11px] leading-4" style={{ color: c.MUTED }}>Use at least 8 characters. Your arrival information remains private to your account.</p>
          <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60" style={primaryButtonStyle(c, { padding: "14px 20px", radius: 12 })} disabled={loading} data-testid={testId("signup-submit")}>
            {loading ? "Creating account…" : "Create account"}
            {!loading && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-[13px]" style={{ color: c.MUTED }}>
        {mode === "login" ? "New to Express Housing?" : "Already have an account?"}{" "}
        <button type="button" onClick={() => changeMode(mode === "login" ? "signup" : "login")} className="min-h-11 rounded-lg px-1 font-bold" style={{ color: c.BLUE }} data-testid={testId("alternate-mode")}>
          {mode === "login" ? "Create account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
