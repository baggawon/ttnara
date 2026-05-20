import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";

export interface ChatNoticeUpdateProps {
  id?: number;
  title: string;
  content: string;
  is_active?: boolean;
  display_order?: number;
}

export const POST = async (json: ChatNoticeUpdateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);
    if (!json.title?.trim() || !json.content?.trim()) {
      return { result: false, message: "제목과 내용을 모두 입력하세요." };
    }

    const data = {
      title: json.title.trim().slice(0, 100),
      content: json.content.trim().slice(0, 200),
      is_active: json.is_active ?? false,
      display_order: json.display_order ?? 1,
    };

    const notice = json.id
      ? await handleConnect((prisma) =>
          prisma.chat_notice.update({ where: { id: json.id }, data })
        )
      : await handleConnect((prisma) => prisma.chat_notice.create({ data }));

    await sendChatAdminEvent({ kind: "notices_changed" });
    return { result: true, data: notice, message: "저장되었습니다." };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
