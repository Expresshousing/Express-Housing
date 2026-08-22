import React from "react";
import { Mail } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle, iconTileStyle, microBadgeStyle } from "@/lib/designSystem";

export default function EmailsView({ emails }) {
  const { colors: c, isDarkMode } = useTheme();
  const anyLive = emails.some((e) => e.status === "sent");
  const anyMocked = emails.some((e) => e.status !== "sent");
  return (
    <div className="mt-6">
      <div className="text-[13px] px-4 py-3 mb-4 rounded-xl" style={{ color: c.ORANGE, background: `${c.ORANGE}12`, border: `1px solid ${c.ORANGE}33` }}>
        {anyLive && anyMocked
          ? <>Emails marked <strong>sent</strong> below were delivered through Resend. Emails marked <strong>sent (mocked)</strong> were only logged — Resend wasn't configured yet when those went out.</>
          : anyLive
          ? <>Email delivery is <strong>live</strong> via Resend — everything below actually reached the guest's inbox.</>
          : <>Email sending is currently <strong>simulated</strong> — every email below was generated and logged, but not delivered. Set <code>RESEND_API_KEY</code> in backend/.env to send for real.</>}
      </div>
      {emails.length === 0 ? (
        <p className="py-12 text-center" style={{ color: c.MUTED }}>No emails yet</p>
      ) : (
        <div className="space-y-3" data-testid="admin-emails-list">
          {emails.map((e) => (
            <div key={e.id} style={cardStyle(c, isDarkMode)}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span style={iconTileStyle(c.BLUE, 36, 10)}><Mail size={15} /></span>
                  <p className="font-semibold text-[13px] truncate">{e.subject}</p>
                </div>
                <span className="shrink-0" style={microBadgeStyle(e.status === "sent" ? c.GREEN : e.status?.startsWith("failed") ? c.RED : c.MUTED)}>{e.status}</span>
              </div>
              <p className="text-[11px] mt-1" style={{ color: c.MUTED }}>To: {e.to_name} &lt;{e.to_email}&gt; · {new Date(e.created_at).toLocaleString()}</p>
              <p className="text-[13px] mt-2 whitespace-pre-line line-clamp-4" style={{ color: c.MUTED }}>{e.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
