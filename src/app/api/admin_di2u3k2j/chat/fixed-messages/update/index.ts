import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";
import { logChatModeration } from "@/helpers/server/chatModerationLog";

export interface ChatFixedMessageUpdateProps {
  topic_id: number;
  content: string;
  is_active?: boolean;
}

export const POST = async (json: ChatFixedMessageUpdateProps) => {
  try {
    const { adminUid } = await requestValidator([RequestValidator.Admin], json);
    if (!json.topic_id) {
      return { result: false, message: "토픽을 선택하세요." };
    }
    if (!json.content?.trim()) {
      return { result: false, message: "내용을 입력하세요." };
    }
    const content = json.content.trim().slice(0, 500);
    const isActive = json.is_active ?? true;

    // The chat_server's cache treats fixed_messages as a topic_id → content
    // map and assumes one row per topic. Enforce that here by deleting other
    // rows for the same topic before inserting/updating.
    await handleConnect(async (prisma) => {
      await prisma.chat_fixed_message.deleteMany({
        where: { topic_id: json.topic_id },
      });
      return prisma.chat_fixed_message.create({
        data: {
          topic_id: json.topic_id,
          content,
          author_id: adminUid!,
          is_active: isActive,
        },
      });
    });

    if (isActive) {
      await sendChatAdminEvent({
        kind: "set_fixed",
        topic_id: json.topic_id,
        content,
      });
      await logChatModeration({
        action: "fixed_set",
        topic_id: json.topic_id,
        by_admin_id: adminUid ?? null,
        metadata: { content },
      });
    } else {
      await sendChatAdminEvent({
        kind: "unset_fixed",
        topic_id: json.topic_id,
      });
      await logChatModeration({
        action: "fixed_unset",
        topic_id: json.topic_id,
        by_admin_id: adminUid ?? null,
      });
    }

    return { result: true, message: "저장되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
