import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";

export interface ChatSettingsUpdateProps {
  chat_server_url?: string;
  level_moderator?: number;
  level_chat?: number;
  max_chat_length?: number;
  max_display_items?: number;
  spam_frequency_seconds?: number;
  spam_penalty_second?: number;
  spam_penalty_third?: number;
  spam_penalty_last?: number;
  chat_delete_hours?: number;
}

export const POST = async (json: ChatSettingsUpdateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const existing = await handleConnect((prisma) =>
      prisma.chat_setting.findFirst({ orderBy: { id: "asc" } })
    );

    const data = {
      chat_server_url: json.chat_server_url ?? undefined,
      level_moderator: json.level_moderator,
      level_chat: json.level_chat,
      max_chat_length: json.max_chat_length,
      max_display_items: json.max_display_items,
      spam_frequency_seconds: json.spam_frequency_seconds,
      spam_penalty_second: json.spam_penalty_second,
      spam_penalty_third: json.spam_penalty_third,
      spam_penalty_last: json.spam_penalty_last,
      chat_delete_hours: json.chat_delete_hours,
    };

    const updated = existing
      ? await handleConnect((prisma) =>
          prisma.chat_setting.update({ where: { id: existing.id }, data })
        )
      : await handleConnect((prisma) => prisma.chat_setting.create({ data }));

    await sendChatAdminEvent({ kind: "config_changed" });
    return {
      result: true,
      data: updated,
      message: "채팅 설정이 저장되었습니다.",
    };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
