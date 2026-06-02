import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";
import { logChatModeration } from "@/helpers/server/chatModerationLog";

export interface ChatModerationBanProps {
  uid: string;
  reason?: string;
}

export const POST = async (json: ChatModerationBanProps) => {
  try {
    const { adminUid } = await requestValidator([RequestValidator.Admin], json);
    if (!json.uid) {
      return { result: false, message: "유저가 필요합니다." };
    }
    // Add the user to the chat_setting `banned_users` relation. The chat_setting
    // singleton is created on first settings read; ensure it exists.
    const setting = await handleConnect(async (prisma) => {
      let s = await prisma.chat_setting.findFirst({ orderBy: { id: "asc" } });
      if (!s) s = await prisma.chat_setting.create({ data: {} });
      return s;
    });
    if (!setting) {
      return { result: false, message: "채팅 설정을 불러올 수 없습니다." };
    }
    // handleConnect swallows DB errors and returns undefined (e.g. the uid no
    // longer exists -> P2025 on connect). Null-check before broadcasting and
    // audit-logging so a ban that never persisted isn't reported as success.
    const updated = await handleConnect((prisma) =>
      prisma.chat_setting.update({
        where: { id: setting.id },
        data: { banned_users: { connect: { id: json.uid } } },
      })
    );
    if (!updated) {
      return { result: false, message: "차단 처리에 실패했습니다." };
    }
    await sendChatAdminEvent({ kind: "ban", uid: json.uid });
    await logChatModeration({
      action: "ban",
      target_uid: json.uid,
      by_admin_id: adminUid ?? null,
      reason: json.reason ?? null,
    });
    return { result: true, message: "차단 처리되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
