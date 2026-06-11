import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { logChatModeration } from "@/helpers/server/chatModerationLog";

export interface ChatHistoryPurgeProps {
  /** Permanently delete messages older than this many hours. */
  hours: number;
}

/**
 * Hard-deletes (permanently removes) chat messages older than `hours`. Unlike
 * the chat_server's retention sweep — which only soft-hides — this drops the
 * rows entirely and is irreversible. Admin-triggered from the chat log page.
 */
export const POST = async (json: ChatHistoryPurgeProps) => {
  try {
    const { adminUid } = await requestValidator([RequestValidator.Admin], json);
    const hours = Number(json.hours);
    if (!hours || hours < 1) {
      return { result: false, message: "유효한 시간을 입력하세요." };
    }
    const before = new Date(Date.now() - hours * 60 * 60 * 1000);

    const deleted = await handleConnect((prisma) =>
      prisma.chat_message.deleteMany({
        where: { created_at: { lt: before } },
      })
    );
    const count = deleted?.count ?? 0;

    await logChatModeration({
      action: "history_purge",
      by_admin_id: adminUid ?? null,
      metadata: { hours, deleted_count: count, before: before.toISOString() },
    });

    return {
      result: true,
      data: { count },
      message: `${count}건의 메시지를 삭제했습니다.`,
    };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
