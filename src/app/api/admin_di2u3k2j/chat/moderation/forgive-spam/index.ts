import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";
import { logChatModeration } from "@/helpers/server/chatModerationLog";

export interface ChatModerationForgiveSpamProps {
  uids: string[];
}

const MAX_BATCH = 100;

/**
 * Clears the given users' in-memory spam state on the chat_server (offence
 * counter + any active spam penalty window), letting them chat again
 * immediately. Spam state is never persisted — it lives only in the
 * chat_server's SpamTracker — so there is no DB row to delete here; we just
 * signal the server and audit each release.
 */
export const POST = async (json: ChatModerationForgiveSpamProps) => {
  try {
    const { adminUid } = await requestValidator([RequestValidator.Admin], json);

    const uids = Array.from(
      new Set((json.uids ?? []).filter((u) => typeof u === "string" && u))
    );
    if (uids.length === 0) {
      return { result: false, message: "유저가 필요합니다." };
    }
    if (uids.length > MAX_BATCH) {
      return {
        result: false,
        message: `한 번에 최대 ${MAX_BATCH}명까지 해제할 수 있습니다.`,
      };
    }

    for (const uid of uids) {
      await sendChatAdminEvent({ kind: "forgive_spam", uid });
      await logChatModeration({
        action: "forgive_spam",
        target_uid: uid,
        by_admin_id: adminUid ?? null,
      });
    }

    return { result: true, message: "도배 상태가 해제되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
