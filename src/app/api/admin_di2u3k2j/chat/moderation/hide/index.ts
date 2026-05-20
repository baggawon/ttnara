import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";
import { logChatModeration } from "@/helpers/server/chatModerationLog";

export interface ChatModerationHideProps {
  message_id: string;
  reason?: string;
}

export const POST = async (json: ChatModerationHideProps) => {
  try {
    const { adminUid } = await requestValidator([RequestValidator.Admin], json);
    if (!json.message_id) {
      return { result: false, message: "메시지 ID가 필요합니다." };
    }
    const updated = await handleConnect((prisma) =>
      prisma.chat_message.update({
        where: { id: json.message_id },
        data: {
          is_hidden: true,
          hidden_by_id: adminUid ?? null,
          hidden_at: new Date(),
        },
        select: { id: true, topic_id: true },
      })
    );
    if (!updated) {
      return { result: false, message: "메시지를 찾을 수 없습니다." };
    }
    await sendChatAdminEvent({
      kind: "hide_message",
      message_id: updated.id,
      topic_id: updated.topic_id,
    });
    await logChatModeration({
      action: "hide",
      target_message_id: updated.id,
      topic_id: updated.topic_id,
      by_admin_id: adminUid ?? null,
      reason: json.reason ?? null,
    });
    return { result: true, message: "메시지가 숨김 처리되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
