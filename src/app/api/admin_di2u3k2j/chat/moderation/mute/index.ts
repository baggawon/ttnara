import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";
import { logChatModeration } from "@/helpers/server/chatModerationLog";

export interface ChatModerationMuteProps {
  uid: string;
  /** Mute duration in minutes. */
  minutes: number;
  reason?: string;
}

export const POST = async (json: ChatModerationMuteProps) => {
  try {
    const { adminUid } = await requestValidator([RequestValidator.Admin], json);
    if (!json.uid) {
      return { result: false, message: "유저가 필요합니다." };
    }
    if (!json.minutes || json.minutes < 1) {
      return { result: false, message: "유효한 시간을 입력하세요." };
    }
    const until = new Date(Date.now() + json.minutes * 60_000);

    await handleConnect((prisma) =>
      prisma.chat_muted_user.upsert({
        where: { uid: json.uid },
        update: {
          until,
          by_admin_id: adminUid ?? null,
          reason: json.reason?.slice(0, 200) ?? null,
        },
        create: {
          uid: json.uid,
          until,
          by_admin_id: adminUid ?? null,
          reason: json.reason?.slice(0, 200) ?? null,
        },
      })
    );

    await sendChatAdminEvent({
      kind: "mute",
      uid: json.uid,
      until: until.toISOString(),
    });

    await logChatModeration({
      action: "mute",
      target_uid: json.uid,
      by_admin_id: adminUid ?? null,
      reason: json.reason ?? null,
      metadata: { minutes: json.minutes, until: until.toISOString() },
    });

    return { result: true, message: "뮤트 처리되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
