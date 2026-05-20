import { createHmac } from "crypto";

/**
 * Issues short-lived HS256 session tokens for the chat WebSocket. The Rust
 * `chat_server` verifies these with `CHAT_JWT_SECRET`. Claims carry a
 * profile snapshot so the chat server doesn't have to query Postgres on
 * every connect or message.
 *
 * Token TTL is intentionally short (default 30 min). The frontend should
 * refresh the token by calling `/api/chat/token` again before reconnect.
 */

const DEFAULT_TTL_SECONDS = 60 * 30;

export interface ChatTokenClaims {
  sub: string;
  displayname: string;
  rank_level: number;
  rank_image: string | null;
  auth_level: number;
}

const base64UrlEncode = (input: Buffer | string): string => {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const signChatToken = (
  claims: ChatTokenClaims,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): { token: string; expiresAt: number } => {
  const secret = process.env.CHAT_JWT_SECRET;
  if (!secret) {
    throw new Error("CHAT_JWT_SECRET is not set");
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlSeconds;

  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    ...claims,
    iat: now,
    exp,
    // `rank_image: null` is fine — the chat_server treats it as Option<String>
  };

  const headerSegment = base64UrlEncode(JSON.stringify(header));
  const payloadSegment = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${headerSegment}.${payloadSegment}`;

  const signature = createHmac("sha256", secret).update(signingInput).digest();
  const signatureSegment = base64UrlEncode(signature);

  return {
    token: `${signingInput}.${signatureSegment}`,
    expiresAt: exp,
  };
};
