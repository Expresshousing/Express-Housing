import React, { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, MessageSquare, Send, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";
import { primaryButtonStyle } from "@/lib/designSystem";

export const MAX_ATTACHMENTS = 4;
const MAX_DIMENSION = 1600;
// Comfortably under the server's per-photo ceiling once base64 overhead is added.
const MAX_ATTACHMENT_CHARS = 1_800_000;

export function chatTimestamp(iso, now = new Date()) {
  if (!iso) return "";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  const time = at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (at.toDateString() === now.toDateString()) return time;
  return `${at.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

/**
 * Shrinks a photo in the browser before it is sent.
 *
 * A phone photo is several megabytes; a maintenance snapshot only has to be
 * legible. Resizing here keeps the message small enough to store and quick to
 * load for whoever opens the thread next.
 */
export async function shrinkImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });

  const image = await new Promise((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("That file is not an image"));
    element.src = dataUrl;
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.82;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (out.length > MAX_ATTACHMENT_CHARS && quality > 0.4) {
    quality -= 0.12;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  if (out.length > MAX_ATTACHMENT_CHARS) throw new Error("That photo is too large");
  return out;
}

/**
 * Keeps a scrollable element pinned to its newest content.
 *
 * Sets scrollTop rather than calling scrollIntoView, which walks up the
 * ancestors and drags the page itself on every refresh.
 */
export function useStickToBottom(ref, dependency) {
  useEffect(() => {
    const element = ref.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [ref, dependency]);
}

function Bubble({ message, mineSender, theirLabel, colors }) {
  const mine = message.sender === mineSender;
  const photos = message.attachments || [];
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[min(680px,82%)] rounded-2xl px-5 py-4"
        style={mine ? { background: colors.BLUE, color: "#FFFFFF" } : { background: colors.CARD2, color: colors.TEXT }}
      >
        {photos.length > 0 && (
          <div className={`mb-2 grid gap-2 ${photos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {photos.map((src, index) => (
              <a key={index} href={src} target="_blank" rel="noreferrer" aria-label={`Open photo ${index + 1} full size`}>
                <img
                  src={src}
                  alt={`Shared photo ${index + 1}`}
                  className="w-full cursor-zoom-in rounded-xl object-cover"
                  style={{ maxHeight: photos.length > 1 ? 180 : 320 }}
                />
              </a>
            ))}
          </div>
        )}
        {message.body && <p className="whitespace-pre-wrap text-[16px] leading-relaxed">{message.body}</p>}
        <p className="mt-2 text-[12px]" style={{ opacity: 0.8 }}>
          {mine ? "You" : theirLabel} · {chatTimestamp(message.created_at)}
        </p>
      </div>
    </div>
  );
}

/**
 * A full-page conversation. Both the guest portal and the operations inbox use
 * it, so the two stay identical in behaviour and only differ in their labels.
 */
export function ChatWindow({
  title,
  subtitle,
  messages,
  mineSender,
  theirLabel,
  loading = false,
  emptyHint,
  onSend,
  onClose,
  closeLabel = "Close",
}) {
  const { colors: c } = useTheme();
  const [draft, setDraft] = useState("");
  const [photos, setPhotos] = useState([]);
  const [sending, setSending] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const listRef = useRef(null);
  const fileRef = useRef(null);

  useStickToBottom(listRef, messages);

  // Escape closes, and the page behind must not scroll while this is open.
  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const addPhotos = async (event) => {
    const files = [...(event.target.files || [])];
    event.target.value = "";
    if (!files.length) return;
    const room = MAX_ATTACHMENTS - photos.length;
    if (room <= 0) {
      toast.error(`You can send up to ${MAX_ATTACHMENTS} photos at a time`);
      return;
    }
    setPreparing(true);
    try {
      const prepared = [];
      for (const file of files.slice(0, room)) {
        try {
          prepared.push(await shrinkImage(file));
        } catch {
          toast.error(`Could not add ${file.name}`);
        }
      }
      if (prepared.length) setPhotos((current) => [...current, ...prepared]);
    } finally {
      setPreparing(false);
    }
  };

  const submit = async () => {
    const body = draft.trim();
    if (!body && !photos.length) return;
    setSending(true);
    try {
      await onSend(body, photos);
      setDraft("");
      setPhotos([]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: c.BG }} role="dialog" aria-modal="true" aria-label={title}>
      <header className="flex items-start justify-between gap-4 border-b px-5 py-4 md:px-8" style={{ borderColor: c.BORDER }}>
        <div className="min-w-0">
          <h2 className="truncate text-[22px] font-extrabold leading-tight md:text-[28px]">{title}</h2>
          {subtitle && <p className="mt-1 truncate text-[14px]" style={{ color: c.MUTED }}>{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex shrink-0 items-center gap-2 rounded-full border px-4 py-3 text-[15px] font-bold"
          style={{ borderColor: c.BORDER, color: c.TEXT }}
          data-testid="chat-close"
        >
          <X size={20} /> {closeLabel}
        </button>
      </header>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-6 md:px-8" data-testid="chat-messages">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          {loading && <p className="text-center text-[15px]" style={{ color: c.MUTED }}>Loading…</p>}
          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: c.CARD2, color: c.BLUE }}>
                <MessageSquare size={34} />
              </div>
              <p className="mt-6 text-[20px] font-bold">No messages yet</p>
              <p className="mt-2 max-w-md text-[15px]" style={{ color: c.MUTED }}>{emptyHint}</p>
            </div>
          )}
          {messages.map((message) => (
            <Bubble key={message.id} message={message} mineSender={mineSender} theirLabel={theirLabel} colors={c} />
          ))}
        </div>
      </div>

      <div className="border-t px-5 py-4 md:px-8" style={{ borderColor: c.BORDER, background: c.CARD }}>
        <div className="mx-auto w-full max-w-4xl">
          {photos.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2" data-testid="chat-pending-photos">
              {photos.map((src, index) => (
                <div key={index} className="relative">
                  <img src={src} alt={`Attached ${index + 1}`} className="h-20 w-20 rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: "#DC2626", color: "#FFFFFF" }}
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="sr-only" htmlFor="chat-input">Your message</label>
          <textarea
            id="chat-input"
            className="input-eh"
            rows={2}
            placeholder="Type your message…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit(); }}
            style={{ fontSize: 16 }}
            data-testid="chat-input"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} data-testid="chat-file-input" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={preparing || photos.length >= MAX_ATTACHMENTS}
              className="flex items-center gap-2 rounded-full border px-4 py-3 text-[15px] font-bold"
              style={{ borderColor: c.BORDER, color: c.TEXT }}
              data-testid="chat-add-photo"
            >
              <ImagePlus size={19} /> {preparing ? "Adding…" : "Add photo"}
            </button>
            <button
              type="button"
              style={primaryButtonStyle(c)}
              onClick={submit}
              disabled={sending || (!draft.trim() && !photos.length)}
              data-testid="chat-send"
            >
              <span className="flex items-center gap-2 text-[15px]"><Send size={18} />{sending ? "Sending…" : "Send"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SupportChat({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const timer = setInterval(() => load({ quiet: true }), 15000);
    return () => clearInterval(timer);
  }, [load]);

  const send = async (body, attachments) => {
    try {
      await api.post("/support/messages", { body, attachments });
      await load({ quiet: true });
    } catch {
      toast.error("Could not send your message. Please try again.");
    }
  };

  return (
    <ChatWindow
      title="Message the Express Housing team"
      subtitle="Anything about your stay — access, maintenance, dates, checkout. We reply here."
      messages={messages}
      mineSender="guest"
      theirLabel="Express Housing"
      loading={loading}
      emptyHint="Send the first message below. You can attach a photo if something needs fixing."
      onSend={send}
      onClose={onClose}
      closeLabel="Close"
    />
  );
}
