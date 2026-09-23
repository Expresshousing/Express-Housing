import React, { useCallback, useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { ChatWindow, chatTimestamp } from "../SupportChat";
import { apiErrorMessage } from "./adminUtils";

export default function MessagesView({ threads = [], onReload }) {
  const { colors: c } = useTheme();
  const [openId, setOpenId] = useState(null);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(false);

  const openThread = useCallback(async (userId, { quiet = false } = {}) => {
    if (!quiet) { setLoading(true); setOpenId(userId); }
    try {
      const { data } = await api.get(`/admin/support/threads/${userId}`);
      setThread(data);
      // Opening clears the unread flags server-side; refresh so the badge follows.
      await onReload?.();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not open that conversation"));
      if (!quiet) { setOpenId(null); setThread(null); }
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [onReload]);

  // Keep the open conversation current while it is being read.
  useEffect(() => {
    if (!openId) return undefined;
    const timer = setInterval(() => openThread(openId, { quiet: true }), 15000);
    return () => clearInterval(timer);
  }, [openId, openThread]);

  const close = useCallback(() => { setOpenId(null); setThread(null); }, []);

  const reply = async (body, attachments) => {
    try {
      await api.post(`/admin/support/threads/${openId}`, { body, attachments });
      await openThread(openId, { quiet: true });
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not send the reply"));
    }
  };

  if (openId && thread) {
    return (
      <ChatWindow
        title={thread.user_name || thread.user_email}
        subtitle={thread.user_email}
        messages={thread.messages}
        mineSender="admin"
        theirLabel={thread.user_name || "Guest"}
        loading={loading}
        emptyHint="Nothing here yet."
        onSend={reply}
        onClose={close}
        closeLabel="Back to messages"
      />
    );
  }

  if (!threads.length) {
    return (
      <div className="py-20 text-center" data-testid="messages-empty">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: c.CARD2, color: c.BLUE }}>
          <MessageSquare size={24} />
        </div>
        <h2 className="mt-5 text-[22px] font-black tracking-tight">No messages yet</h2>
        <p className="mt-2 text-[14px]" style={{ color: c.MUTED }}>
          Guests reach you from the Support tab in their portal. Their messages arrive here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="messages-view">
      {threads.map((row) => (
        <button
          key={row.user_id}
          type="button"
          onClick={() => openThread(row.user_id)}
          className="rounded-2xl border p-5 text-left transition-colors"
          style={{ background: c.CARD, borderColor: row.unread > 0 ? c.BLUE : c.BORDER }}
          data-testid={`thread-${row.user_id}`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-[16px] font-bold">{row.user_name || row.user_email}</p>
            {row.unread > 0 && (
              <span
                className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px] font-bold"
                style={{ background: "#DC2626", color: "#FFFFFF" }}
                data-testid={`thread-unread-${row.user_id}`}
              >
                {row.unread}
              </span>
            )}
          </div>
          {row.booking?.apartment_title && (
            <p className="mt-1.5 text-[12px]" style={{ color: c.MUTED }}>
              {row.booking.apartment_title} · {row.booking.check_in} → {row.booking.check_out}
            </p>
          )}
          <p className="mt-3 line-clamp-2 text-[14px]" style={{ color: c.MUTED }}>
            {row.last_sender === "admin" ? "You: " : ""}{row.last_message}
          </p>
          <p className="mt-3 text-[11px]" style={{ color: c.MUTED }}>
            {row.message_count} message{row.message_count === 1 ? "" : "s"} · {chatTimestamp(row.last_at)}
          </p>
        </button>
      ))}
    </div>
  );
}
