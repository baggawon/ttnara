import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";

export interface ChatBannedWordDeleteProps {
  ids: number[];
}

export const POST = async (json: ChatBannedWordDeleteProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);
    if (!json.ids?.length) {
      return { result: false, message: "삭제할 단어가 없습니다." };
    }
    await handleConnect((prisma) =>
      prisma.chat_banned_word.deleteMany({ where: { id: { in: json.ids } } })
    );
    await sendChatAdminEvent({ kind: "config_changed" });
    return { result: true, message: "삭제되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
