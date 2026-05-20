import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";
import { logChatModeration } from "@/helpers/server/chatModerationLog";

export interface ChatModerationUnmuteProps {
  uid: string;
}

export const POST = async (json: ChatModerationUnmuteProps) => {
  try {
    const { adminUid } = await requestValidator([RequestValidator.Admin], json);
    if (!json.uid) {
      return { result: false, message: "유저가 필요합니다." };
    }
    await handleConnect((prisma) =>
      prisma.chat_muted_user.deleteMany({ where: { uid: json.uid } })
    );
    await sendChatAdminEvent({ kind: "unmute", uid: json.uid });
    await logChatModeration({
      action: "unmute",
      target_uid: json.uid,
      by_admin_id: adminUid ?? null,
    });
    return { result: true, message: "뮤트가 해제되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
