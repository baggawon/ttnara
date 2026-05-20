import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";

export interface ChatNoticeDeleteProps {
  ids: number[];
}

export const POST = async (json: ChatNoticeDeleteProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);
    if (!json.ids?.length) {
      return { result: false, message: "삭제할 공지가 없습니다." };
    }
    await handleConnect((prisma) =>
      prisma.chat_notice.deleteMany({ where: { id: { in: json.ids } } })
    );
    await sendChatAdminEvent({ kind: "notices_changed" });
    return { result: true, message: "삭제되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
