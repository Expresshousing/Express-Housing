import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle, primaryButtonStyle } from "@/lib/designSystem";

export function chatTimestamp(iso, now = new Date()) {
  if (!iso) return "";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const time = at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (at.toDateString() === now.toDateString()) return time;
  return `${at.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

/**
 * Keeps a scrollable element pinned to its newest content.
 *
 * Deliberately sets scrollTop rather than calling scrollIntoView: that walks up
 * the ancestors and scrolls the page itself, so every poll yanked the whole
 * page while someone was reading it.
 */
export function useStickToBottom(ref, dependency) {
  useEffect(() => {
    const element = ref.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [ref, dependency]);
}

export function MessageBubble({ message, mineLabel, theirLabel, colors }) {
  const mine = message.sender === mineLabel.sender;
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[78%] rounded-2xl px-4 py-3"
        style={mine
          ? { background: colors.BLUE, color: "#FFFFFF" }
          : { background: colors.CARD2, color: colors.TEXT }}
      >
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed">{message.body}</p>
        <p className="mt-1.5 text-[10px]" style={{ opacity: 0.75 }}>
          {mine ? mineLabel.name : theirLabel} · {chatTimestamp(message.created_at)}
        </p>
      </div>
    </div>
  );
}

export default function SupportChat() {
  const { colors: c, isDarkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const { data } = await api.get("/support/messages");
      setMessages(data.messages || []);
    } catch {
      if (!quiet) toast.error("Could not load your messages");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll so a reply arrives without the guest reloading the page.
  useEffect(() => {
    const timer = setInterval(() => load({ quiet: true }), 15000);
    return () => clearInterval(timer);
  }, [load]);

  useStickToBottom(listRef, messages);

  const send = async () => {
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      await api.post("/support/messages", { body });
      setDraft("");
      await load({ quiet: true });
    } catch {
      toast.error("Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-6" data-testid="support-chat">
      <div
        style={cardStyle(c, isDarkMode, { padding: 0 })}
        className="flex flex-col overflow-hidden"
      >
        {/* Fills the window below the tab strip so a conversation has real room,
            with a floor so it stays usable on a short laptop screen. */}
        <div className="flex flex-col" style={{ height: "min(calc(100vh - 260px), 900px)", minHeight: 520 }}>
          <div className="border-b px-6 py-4" style={{ borderColor: c.BORDER }}>
            <p className="text-[16px] font-extrabold">Message the Express Housing team</p>
            <p className="mt-1 text-[13px]" style={{ color: c.MUTED }}>
              Anything about your stay — access, maintenance, dates, checkout. We reply here.
            </p>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-6 py-6" data-testid="support-messages">
            {loading && <p className="text-center text-[13px]" style={{ color: c.MUTED }}>Loading…</p>}

            {!loading && messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: c.CARD2, color: c.BLUE }}>
                  <MessageSquare size={28} />
                </div>
                <p className="mt-5 text-[16px] font-bold">No messages yet</p>
                <p className="mt-1 text-[14px]" style={{ color: c.MUTED }}>Send the first one below and we'll get back to you.</p>
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                mineLabel={{ sender: "guest", name: "You" }}
                theirLabel="Express Housing"
                colors={c}
              />
            ))}
          </div>

          <div className="border-t p-4" style={{ borderColor: c.BORDER }}>
            <label className="sr-only" htmlFor="support-message">Your message</label>
            <textarea
              id="support-message"
              className="input-eh"
              rows={3}
              placeholder="How can we help?"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) send(); }}
              data-testid="support-input"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-[11px]" style={{ color: c.MUTED }}>⌘ + Enter sends</span>
              <button
                type="button"
                style={primaryButtonStyle(c)}
                onClick={send}
                disabled={sending || !draft.trim()}
                data-testid="support-send"
              >
                <span className="flex items-center gap-2"><Send size={15} />{sending ? "Sending…" : "Send"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
