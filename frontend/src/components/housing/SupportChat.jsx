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

function Bubble({ message, mineSender, colors, onOpenPhoto }) {
  const mine = message.sender === mineSender;
  const photos = message.attachments || [];
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[min(620px,84%)] rounded-2xl px-3.5 py-2"
        style={mine ? { background: colors.BLUE, color: "#FFFFFF" } : { background: colors.CARD2, color: colors.TEXT }}
      >
        {photos.length > 0 && (
          <div className={`mb-2 grid gap-2 ${photos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {photos.map((src, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onOpenPhoto(src)}
                aria-label={`Open photo ${index + 1} full size`}
                className="block w-full"
              >
                <img
                  src={src}
                  alt={`Shared photo ${index + 1}`}
                  className="w-full cursor-zoom-in rounded-xl object-cover"
                  style={{ maxHeight: photos.length > 1 ? 180 : 320 }}
                />
              </button>
            ))}
          </div>
        )}
        {message.body && <p className="whitespace-pre-wrap text-[15px] leading-snug">{message.body}</p>}
        {/* Which side the bubble sits on already says who wrote it, so the line
            under each message is just the time. */}
        <p className="mt-0.5 text-[10px] leading-none" style={{ opacity: 0.7 }}>{chatTimestamp(message.created_at)}</p>
      </div>
    </div>
  );
}

/**
 * A full-page conversation. Both the guest portal and the operations inbox use
 * it, so the two stay identical in behaviour and only differ in their labels.
 */
export function ChatWindow({
  eyebrow = "Express Housing",
  title,
  subtitle,
  messages,
  mineSender,
  loading = false,
  emptyHint,
  onSend,
  onClose,
  closeLabel = "Close",
}) {
  const { colors: c, isDarkMode } = useTheme();
  const [draft, setDraft] = useState("");
  const [photos, setPhotos] = useState([]);
  const [sending, setSending] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [zoomed, setZoomed] = useState(null);
  const listRef = useRef(null);
  const fileRef = useRef(null);

  useStickToBottom(listRef, messages);

  // Escape closes, and the page behind must not scroll while this is open.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      // Escape backs out one layer at a time: the photo first, then the chat.
      setZoomed((current) => {
        if (current) return null;
        onClose();
        return null;
      });
    };
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
    <div className="fixed inset-0 z-[200] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      {/* The page stays visible but washed out behind the sheet, so it is clear
          this sits on top of the portal rather than replacing it. */}
      <button
        type="button"
        className="eh-scrim absolute inset-0"
        style={{ background: isDarkMode ? "rgba(0,0,0,0.62)" : "rgba(255,255,255,0.74)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
        aria-label={closeLabel}
      />

      <section
        className="eh-sheet relative flex h-full w-full flex-col border-l"
        style={{
          background: c.BG,
          borderColor: c.BORDER,
          maxWidth: 1180,
          boxShadow: isDarkMode ? "none" : "-24px 0 70px rgba(0,0,0,0.16)",
        }}
      >
        <header className="flex items-center justify-between gap-3 border-b px-4 py-3 md:px-6" style={{ borderColor: c.BORDER }}>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: c.BLUE }}>{eyebrow}</p>
            <h2 className="truncate text-[19px] font-extrabold leading-tight md:text-[21px]">{title}</h2>
            {subtitle && <p className="truncate text-[12px]" style={{ color: c.MUTED }}>{subtitle}</p>}
          </div>
          {/* Stays a full 44px target: small buttons are hardest on exactly the
              people this chat is for. Only the chrome around it shrank. */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-70"
            style={{ background: c.CARD2, color: c.TEXT }}
            title={closeLabel}
            aria-label={closeLabel}
            data-testid="chat-close"
          >
            <X size={20} />
          </button>
        </header>

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 md:px-6" data-testid="chat-messages">
          <div className="space-y-2">
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
            <Bubble key={message.id} message={message} mineSender={mineSender} colors={c} onOpenPhoto={setZoomed} />
          ))}
        </div>
      </div>


        <div className="border-t px-4 py-2 md:px-6" style={{ borderColor: c.BORDER, background: c.CARD }}>
          <div>
          {photos.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2" data-testid="chat-pending-photos">
              {photos.map((src, index) => (
                <div key={index} className="relative">
                  <img src={src} alt={`Attached ${index + 1}`} className="h-11 w-11 rounded-lg object-cover" />
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
          {/* 16px text stops phones zooming the page when this is focused. */}
          <textarea
            id="chat-input"
            className="input-eh"
            rows={1}
            placeholder="Type your message…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit(); }}
            style={{ fontSize: 16, paddingTop: 6, paddingBottom: 6, minHeight: 42 }}
            data-testid="chat-input"
          />

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} data-testid="chat-file-input" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={preparing || photos.length >= MAX_ATTACHMENTS}
              className="flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold"
              style={{ borderColor: c.BORDER, color: c.TEXT }}
              data-testid="chat-add-photo"
            >
              <ImagePlus size={16} /> {preparing ? "Adding…" : "Add photo"}
            </button>
            <button
              type="button"
              style={{ ...primaryButtonStyle(c, { padding: "0 14px" }), minHeight: 36, fontSize: 13, boxShadow: "none" }}
              onClick={submit}
              disabled={sending || (!draft.trim() && !photos.length)}
              data-testid="chat-send"
            >
              <span className="flex items-center gap-1.5 text-[13px]"><Send size={15} />{sending ? "Sending…" : "Send"}</span>
            </button>
          </div>
          </div>
        </div>
      </section>

      {zoomed && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Photo">
          <button type="button" className="absolute inset-0" onClick={() => setZoomed(null)} aria-label="Close photo" />
          <img src={zoomed} alt="Shared photo, full size" className="relative max-h-full max-w-full rounded-xl object-contain" />
          <button
            type="button"
            onClick={() => setZoomed(null)}
            className="absolute right-4 top-4 flex items-center gap-2 rounded-full px-4 py-3 text-[15px] font-bold"
            style={{ background: "#FFFFFF", color: "#111111" }}
            data-testid="photo-close"
          >
            <X size={20} /> Close
          </button>
        </div>
      )}
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
      eyebrow="Express Housing"
      title="Support"
      subtitle="Access, maintenance, dates or checkout. Photos welcome."
      messages={messages}
      mineSender="guest"
      loading={loading}
      emptyHint="Send the first message below. You can attach a photo if something needs fixing."
      onSend={send}
      onClose={onClose}
      closeLabel="Close"
    />
  );
}
