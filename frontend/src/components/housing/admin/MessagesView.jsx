import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle, primaryButtonStyle } from "@/lib/designSystem";
import { chatTimestamp, MessageBubble, useStickToBottom } from "../SupportChat";
import { apiErrorMessage } from "./adminUtils";

function ConversationModal({ thread, onClose, onSent }) {
  const { colors: c, isDarkMode } = useTheme();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useStickToBottom(listRef, thread.messages);

  // Escape closes, and the page behind must not scroll while the modal is open.
  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-8" role="dialog" aria-modal="true" aria-labelledby="conversation-title">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close conversation" />
      <div
        className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-[22px] border"
        style={{ background: c.BG, borderColor: c.BORDER, height: "min(88vh, 900px)", boxShadow: isDarkMode ? "none" : "0 24px 70px rgba(0,0,0,0.28)" }}
        data-testid="conversation-modal"
      >
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5" style={{ borderColor: c.BORDER }}>
          <div>
            <h2 id="conversation-title" className="text-[24px] font-extrabold leading-none">{thread.user_name || thread.user_email}</h2>
            <p className="mt-2 text-[13px]" style={{ color: c.MUTED }}>{thread.user_email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
            style={{ borderColor: c.BORDER, color: c.TEXT }}
            aria-label="Close"
            data-testid="close-conversation"
          >
            <X size={18} />
          </button>
        </div>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-6 py-6" data-testid="conversation-messages">
          {thread.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              mineLabel={{ sender: "admin", name: "You" }}
              theirLabel={thread.user_name || "Guest"}
              colors={c}
            />
          ))}
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
            onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) send(); }}
            data-testid="support-reply-input"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[11px]" style={{ color: c.MUTED }}>⌘ + Enter sends · Esc closes</span>
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
    </div>
  );
}

export default function MessagesView({ threads = [], onReload }) {
  const { colors: c, isDarkMode } = useTheme();
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
    <>
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
              <p className="text-[15px] font-bold">{row.user_name || row.user_email}</p>
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
              <p className="mt-1.5 text-[11px]" style={{ color: c.MUTED }}>
                {row.booking.apartment_title} · {row.booking.check_in} → {row.booking.check_out}
              </p>
            )}
            <p className="mt-3 line-clamp-2 text-[13px]" style={{ color: c.MUTED }}>
              {row.last_sender === "admin" ? "You: " : ""}{row.last_message}
            </p>
            <p className="mt-3 text-[10px]" style={{ color: c.MUTED }}>
              {row.message_count} message{row.message_count === 1 ? "" : "s"} · {chatTimestamp(row.last_at)}
            </p>
          </button>
        ))}
      </div>

      {openId && loading && (
        <div style={cardStyle(c, isDarkMode, { padding: 32 })} className="mt-5 text-center text-[13px]">Opening conversation…</div>
      )}
      {openId && thread && !loading && (
        <ConversationModal thread={thread} onClose={close} onSent={() => openThread(thread.user_id, { quiet: true })} />
      )}
    </>
  );
}
