import type { Prisma } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";

/**
 * Stable, machine-friendly action codes for the moderation log.
 * Keep these snake_case so the chat_server's pipeline can write the same
 * vocabulary (it inserts into the same table for spam penalties).
 */
export type ChatModerationAction =
  | "mute"
  | "unmute"
  | "ban"
  | "unban"
  | "hide"
  | "unhide"
  | "fixed_set"
  | "fixed_unset"
  | "topic_delete"
  | "spam_warning"
  | "spam_penalty_1"
  | "spam_penalty_2"
  | "spam_penalty_3";

interface LogEntry {
  action: ChatModerationAction;
  target_uid?: string | null;
  target_message_id?: string | null;
  topic_id?: number | null;
  by_admin_id?: string | null;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}

/**
 * Best-effort write to `chat_moderation_log`. Never throws — log failures must
 * not break the underlying admin operation. Logged once on failure for triage.
 */
export const logChatModeration = async (entry: LogEntry): Promise<void> => {
  try {
    await handleConnect((prisma) =>
      prisma.chat_moderation_log.create({
        data: {
          action: entry.action,
          target_uid: entry.target_uid ?? null,
          target_message_id: entry.target_message_id ?? null,
          topic_id: entry.topic_id ?? null,
          by_admin_id: entry.by_admin_id ?? null,
          reason: entry.reason?.slice(0, 200) ?? null,
          metadata: entry.metadata ?? undefined,
        },
      })
    );
  } catch (err) {
    console.warn("[chatModerationLog] write failed", entry.action, err);
  }
};
