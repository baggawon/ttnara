import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";
import { logChatModeration } from "@/helpers/server/chatModerationLog";

export interface ChatModerationUnhideProps {
  message_id: string;
}

export const POST = async (json: ChatModerationUnhideProps) => {
  try {
    const { adminUid } = await requestValidator([RequestValidator.Admin], json);
    if (!json.message_id) {
      return { result: false, message: "메시지 ID가 필요합니다." };
    }
    const updated = await handleConnect((prisma) =>
      prisma.chat_message.update({
        where: { id: json.message_id },
        data: {
          is_hidden: false,
          hidden_by_id: null,
          hidden_at: null,
        },
        select: { id: true, topic_id: true },
      })
    );
    if (!updated) {
      return { result: false, message: "메시지를 찾을 수 없습니다." };
    }
    // No live broadcast — connected clients keep their local hidden state and
    // unhide takes effect on their next reconnect / messages_init.
    await sendChatAdminEvent({
      kind: "unhide_message",
      message_id: updated.id,
      topic_id: updated.topic_id,
    });
    await logChatModeration({
      action: "unhide",
      target_message_id: updated.id,
      topic_id: updated.topic_id,
      by_admin_id: adminUid ?? null,
    });
    return { result: true, message: "메시지 숨김이 해제되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
