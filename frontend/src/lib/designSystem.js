export const cardStyle = (c, isDarkMode, options = {}) => ({
  background: c.CARD,
  border: `1px solid ${c.BORDER}`,
  borderRadius: options.radius ?? 14,
  padding: options.padding ?? 16,
  boxShadow: isDarkMode ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
});

export const iconTileStyle = (color, size = 44, radius = 12) => ({
  width: size,
  height: size,
  minWidth: size,
  borderRadius: radius,
  background: `${color}14`,
  color,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

export const primaryButtonStyle = (c, options = {}) => ({
  minHeight: 44,
  padding: options.padding ?? "13px 20px",
  background: c.BLUE,
  color: "#FFFFFF",
  border: `1px solid ${c.BLUE}`,
  borderRadius: options.radius ?? 12,
  fontFamily: c.INTER,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: `0 8px 24px ${c.BLUE}40`,
});

export const secondaryButtonStyle = (c) => ({
  minHeight: 44,
  padding: "12px 18px",
  background: c.CARD2,
  color: c.TEXT,
  border: `1px solid ${c.BORDER}`,
  borderRadius: 12,
  fontFamily: c.INTER,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "none",
});

export const inputStyle = (c) => ({
  width: "100%",
  minHeight: 48,
  padding: "12px 16px",
  background: c.INPUT_BG,
  color: c.TEXT,
  border: `1px solid ${c.BORDER}`,
  borderRadius: 12,
  outline: "none",
  fontFamily: c.INTER,
  fontSize: 16,
  fontWeight: 500,
  boxSizing: "border-box",
});

export const microBadgeStyle = (color) => ({
  display: "inline-flex",
  alignItems: "center",
  color,
  background: `${color}12`,
  borderRadius: 6,
  padding: "3px 7px",
  fontSize: 10,
  fontWeight: 800,
  lineHeight: 1.4,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
});

export const statusStyle = (status, c) => {
  const color = status === "confirmed" || status === "completed" || status === "connected"
    ? c.GREEN
    : status === "cancelled" || status === "blocked"
      ? c.RED
      : c.ORANGE;
  return {
    ...microBadgeStyle(color),
    border: `1px solid ${color}33`,
    borderRadius: 999,
    padding: "6px 12px",
  };
};

export const pageStyle = (c) => ({ background: c.BG, color: c.TEXT });
