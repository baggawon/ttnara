import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";

export interface ChatTopicUpdateProps {
  id?: number;
  name: string;
  display_order?: number;
  is_active?: boolean;
}

export const POST = async (json: ChatTopicUpdateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);
    if (!json.name?.trim()) {
      return { result: false, message: "토픽 이름이 필요합니다." };
    }

    const data = {
      name: json.name.trim(),
      display_order: json.display_order ?? 1,
      is_active: json.is_active ?? true,
    };

    const topic = json.id
      ? await handleConnect((prisma) =>
          prisma.chat_topic.update({ where: { id: json.id }, data })
        )
      : await handleConnect((prisma) => prisma.chat_topic.create({ data }));

    await sendChatAdminEvent({ kind: "config_changed" });
    return { result: true, data: topic, message: "저장되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
