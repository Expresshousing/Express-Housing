import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { cardStyle, primaryButtonStyle } from "@/lib/designSystem";

function when(iso) {
  if (!iso) return "";
  const at = new Date(iso);
  const today = new Date().toDateString() === at.toDateString();
  return today
    ? at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : `${at.toLocaleDateString([], { month: "short", day: "numeric" })}, ${at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

export default function SupportChat() {
  const { colors: c, isDarkMode } = useTheme();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

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

  // Poll so a reply from the team appears without the guest reloading the page.
  useEffect(() => {
    const timer = setInterval(() => load({ quiet: true }), 15000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages]);

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
    <div className="mt-10 max-w-3xl" data-testid="support-chat">
      <div style={cardStyle(c, isDarkMode, { padding: 0 })} className="flex h-[60vh] flex-col overflow-hidden">
        <div className="border-b px-5 py-4" style={{ borderColor: c.BORDER }}>
          <p className="text-[15px] font-extrabold">Message the Express Housing team</p>
          <p className="mt-1 text-[12px]" style={{ color: c.MUTED }}>
            Anything about your stay — access, maintenance, dates, checkout. We reply here.
          </p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5" data-testid="support-messages">
          {loading && <p className="text-center text-[13px]" style={{ color: c.MUTED }}>Loading…</p>}

          {!loading && messages.length === 0 && (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: c.CARD2, color: c.BLUE }}>
                <MessageSquare size={24} />
              </div>
              <p className="mt-4 text-[14px] font-bold">No messages yet</p>
              <p className="mt-1 text-[13px]" style={{ color: c.MUTED }}>Send the first one below and we'll get back to you.</p>
            </div>
          )}

          {messages.map((message) => {
            const mine = message.sender === "guest";
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[78%] rounded-2xl px-4 py-3"
                  style={mine ? { background: c.BLUE, color: "#FFFFFF" } : { background: c.CARD2, color: c.TEXT }}
                >
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{message.body}</p>
                  <p className="mt-1.5 text-[10px]" style={{ opacity: 0.75 }}>
                    {mine ? "You" : "Express Housing"} · {when(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
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
          <div className="mt-3 flex justify-end">
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
  );
}
