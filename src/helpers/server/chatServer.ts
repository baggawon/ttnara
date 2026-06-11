import { createHmac } from "crypto";

/**
 * Internal client for the Rust chat_server. Posts HMAC-signed events to
 * `/internal/event` so connected sockets see admin changes immediately
 * (instead of waiting for the chat_server's 30s config-cache refresh).
 *
 * Configuration:
 *   - `CHAT_SERVER_INTERNAL_URL` — e.g. http://chat_server:8080
 *   - `CHAT_INTERNAL_SECRET`     — must match chat_server's CHAT_INTERNAL_SECRET
 *
 * If either env var is missing, calls become no-ops and log a warning. This
 * lets the admin API routes work in dev environments without the chat_server
 * running.
 */

export type ChatAdminEvent =
  | { kind: "config_changed" }
  | { kind: "notices_changed" }
  | { kind: "mute"; uid: string; until: string }
  | { kind: "unmute"; uid: string }
  | { kind: "forgive_spam"; uid: string }
  | { kind: "ban"; uid: string }
  | { kind: "unban"; uid: string }
  | { kind: "hide_message"; message_id: string; topic_id: number }
  | { kind: "unhide_message"; message_id: string; topic_id: number }
  | { kind: "set_fixed"; topic_id: number; content: string }
  | { kind: "unset_fixed"; topic_id: number };

export const sendChatAdminEvent = async (
  event: ChatAdminEvent
): Promise<void> => {
  const baseUrl = process.env.CHAT_SERVER_INTERNAL_URL;
  const secret = process.env.CHAT_INTERNAL_SECRET;

  if (!baseUrl || !secret) {
    console.warn(
      "[chatServer] skipping admin event — CHAT_SERVER_INTERNAL_URL or CHAT_INTERNAL_SECRET unset",
      event.kind
    );
    return;
  }

  const body = JSON.stringify(event);
  const ts = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac("sha256", secret)
    .update(ts)
    .update(".")
    .update(body)
    .digest("hex");

  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/internal/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Chat-Timestamp": ts,
        "X-Chat-Signature": signature,
      },
      body,
      // The chat_server should respond within ~1s; cap aggressively so admin
      // calls never block on a degraded chat sidecar.
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) {
      console.warn(`[chatServer] admin event ${event.kind} got ${res.status}`);
    }
  } catch (err) {
    console.warn(`[chatServer] admin event ${event.kind} failed:`, err);
  }
};
