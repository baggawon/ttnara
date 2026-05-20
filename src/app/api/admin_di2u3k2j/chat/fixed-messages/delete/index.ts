import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";
import { logChatModeration } from "@/helpers/server/chatModerationLog";

export interface ChatFixedMessageDeleteProps {
  topic_id: number;
}

export const POST = async (json: ChatFixedMessageDeleteProps) => {
  try {
    const { adminUid } = await requestValidator([RequestValidator.Admin], json);
    if (!json.topic_id) {
      return { result: false, message: "토픽이 필요합니다." };
    }
    await handleConnect((prisma) =>
      prisma.chat_fixed_message.deleteMany({
        where: { topic_id: json.topic_id },
      })
    );
    await sendChatAdminEvent({ kind: "unset_fixed", topic_id: json.topic_id });
    await logChatModeration({
      action: "fixed_unset",
      topic_id: json.topic_id,
      by_admin_id: adminUid ?? null,
    });
    return { result: true, message: "삭제되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
