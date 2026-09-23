import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle, microBadgeStyle, primaryButtonStyle } from "@/lib/designSystem";
import { apiErrorMessage } from "./adminUtils";

function when(iso) {
  if (!iso) return "";
  const at = new Date(iso);
  const today = new Date().toDateString() === at.toDateString();
  return today
    ? at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : at.toLocaleDateString([], { month: "short", day: "numeric" });
}

function Conversation({ thread, onSent }) {
  const { colors: c, isDarkMode } = useTheme();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread]);

  const send = async () => {
    const body = reply.trim();
    if (!body) return;
    setSending(true);
    try {
      await api.post(`/admin/support/threads/${thread.user_id}`, { body });
      setReply("");
      await onSent();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not send the reply"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={cardStyle(c, isDarkMode, { padding: 0 })} className="flex h-[70vh] flex-col overflow-hidden">
      <div className="border-b px-5 py-4" style={{ borderColor: c.BORDER }}>
        <p className="text-[16px] font-extrabold">{thread.user_name || thread.user_email}</p>
        <p className="mt-1 text-[12px]" style={{ color: c.MUTED }}>{thread.user_email}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5" data-testid="conversation-messages">
        {thread.messages.map((message) => {
          const fromAdmin = message.sender === "admin";
          return (
            <div key={message.id} className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[78%] rounded-2xl px-4 py-3"
                style={fromAdmin
                  ? { background: c.BLUE, color: "#FFFFFF" }
                  : { background: c.CARD2, color: c.TEXT }}
              >
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{message.body}</p>
                <p className="mt-1.5 text-[10px]" style={{ opacity: 0.75 }}>
                  {fromAdmin ? "You" : thread.user_name || "Guest"} · {when(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t p-4" style={{ borderColor: c.BORDER }}>
        <label className="sr-only" htmlFor="support-reply">Reply to this guest</label>
        <textarea
          id="support-reply"
          className="input-eh"
          rows={3}
          placeholder="Write a reply…"
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) send();
          }}
          data-testid="support-reply-input"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[11px]" style={{ color: c.MUTED }}>⌘ + Enter sends</span>
          <button
            type="button"
            style={primaryButtonStyle(c)}
            onClick={send}
            disabled={sending || !reply.trim()}
            data-testid="support-send"
          >
            <span className="flex items-center gap-2"><Send size={15} />{sending ? "Sending…" : "Send reply"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesView({ threads = [], onReload }) {
  const { colors: c, isDarkMode } = useTheme();
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(false);

  const openThread = useCallback(async (userId, { quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const { data } = await api.get(`/admin/support/threads/${userId}`);
      setThread(data);
      setSelectedId(userId);
      // Opening clears the unread flags server-side; refresh the list so the badge follows.
      await onReload?.();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not open that conversation"));
    } finally {
      setLoading(false);
    }
  }, [onReload]);

  // Keep the open conversation current while the operator is reading it.
  useEffect(() => {
    if (!selectedId) return undefined;
    const timer = setInterval(() => openThread(selectedId, { quiet: true }), 15000);
    return () => clearInterval(timer);
  }, [selectedId, openThread]);

  if (!threads.length) {
    return (
      <div className="py-20 text-center" data-testid="messages-empty">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: c.CARD2, color: c.BLUE }}>
          <MessageSquare size={24} />
        </div>
        <h2 className="mt-5 text-[22px] font-black tracking-tight">No messages yet</h2>
        <p className="mt-2 text-[14px]" style={{ color: c.MUTED }}>
          Guests can reach you from the Support tab in their portal. Their messages arrive here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]" data-testid="messages-view">
      <div className="space-y-2">
        {threads.map((row) => {
          const active = row.user_id === selectedId;
          return (
            <button
              key={row.user_id}
              type="button"
              onClick={() => openThread(row.user_id)}
              className="w-full rounded-2xl border p-4 text-left transition-colors"
              style={{
                background: active ? c.CARD2 : c.CARD,
                borderColor: active ? c.BLUE : c.BORDER,
              }}
              data-testid={`thread-${row.user_id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] font-bold">{row.user_name || row.user_email}</p>
                {row.unread > 0 && (
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                    style={{ background: "#DC2626", color: "#FFFFFF" }}
                    data-testid={`thread-unread-${row.user_id}`}
                  >
                    {row.unread}
                  </span>
                )}
              </div>
              {row.booking?.apartment_title && (
                <p className="mt-1 text-[11px]" style={{ color: c.MUTED }}>
                  {row.booking.apartment_title} · {row.booking.check_in} → {row.booking.check_out}
                </p>
              )}
              <p className="mt-2 line-clamp-2 text-[12px]" style={{ color: c.MUTED }}>
                {row.last_sender === "admin" ? "You: " : ""}{row.last_message}
              </p>
              <p className="mt-2 text-[10px]" style={{ color: c.MUTED }}>{when(row.last_at)}</p>
            </button>
          );
        })}
      </div>

      <div>
        {loading && <div style={cardStyle(c, isDarkMode, { padding: 40 })} className="text-center text-[13px]" >Loading conversation…</div>}
        {!loading && thread && <Conversation thread={thread} onSent={() => openThread(thread.user_id, { quiet: true })} />}
        {!loading && !thread && (
          <div style={cardStyle(c, isDarkMode, { padding: 48 })} className="text-center">
            <span style={microBadgeStyle(c.BLUE)}>Select a guest</span>
            <p className="mt-4 text-[14px]" style={{ color: c.MUTED }}>Pick a conversation on the left to read it and reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}
