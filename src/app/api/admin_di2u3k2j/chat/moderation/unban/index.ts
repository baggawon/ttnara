import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";
import { logChatModeration } from "@/helpers/server/chatModerationLog";

export interface ChatModerationUnbanProps {
  uid: string;
}

export const POST = async (json: ChatModerationUnbanProps) => {
  try {
    const { adminUid } = await requestValidator([RequestValidator.Admin], json);
    if (!json.uid) {
      return { result: false, message: "유저가 필요합니다." };
    }
    const setting = await handleConnect((prisma) =>
      prisma.chat_setting.findFirst({ orderBy: { id: "asc" } })
    );
    if (setting) {
      await handleConnect((prisma) =>
        prisma.chat_setting.update({
          where: { id: setting.id },
          data: { banned_users: { disconnect: { id: json.uid } } },
        })
      );
    }
    await sendChatAdminEvent({ kind: "unban", uid: json.uid });
    await logChatModeration({
      action: "unban",
      target_uid: json.uid,
      by_admin_id: adminUid ?? null,
    });
    return { result: true, message: "차단이 해제되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
