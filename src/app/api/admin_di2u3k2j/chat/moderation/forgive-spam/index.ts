import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";
import { logChatModeration } from "@/helpers/server/chatModerationLog";

export interface ChatModerationForgiveSpamProps {
  uid: string;
}

/**
 * Clears a user's in-memory spam state on the chat_server (offence counter +
 * any active spam penalty window), letting them chat again immediately. Spam
 * state is never persisted — it lives only in the chat_server's SpamTracker —
 * so there is no DB row to delete here; we just signal the server and audit it.
 */
export const POST = async (json: ChatModerationForgiveSpamProps) => {
  try {
    const { adminUid } = await requestValidator([RequestValidator.Admin], json);
    if (!json.uid) {
      return { result: false, message: "유저가 필요합니다." };
    }

    await sendChatAdminEvent({ kind: "forgive_spam", uid: json.uid });

    await logChatModeration({
      action: "forgive_spam",
      target_uid: json.uid,
      by_admin_id: adminUid ?? null,
    });

    return { result: true, message: "도배 상태가 해제되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
