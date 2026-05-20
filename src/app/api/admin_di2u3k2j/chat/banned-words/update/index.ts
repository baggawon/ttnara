import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { sendChatAdminEvent } from "@/helpers/server/chatServer";

export interface ChatBannedWordUpdateProps {
  /** Comma- or newline-separated list of new words to add. */
  words: string;
}

export const POST = async (json: ChatBannedWordUpdateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);
    if (!json.words?.trim()) {
      return { result: false, message: "단어를 입력하세요." };
    }
    const tokens = Array.from(
      new Set(
        json.words
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => s.slice(0, 100))
      )
    );

    if (tokens.length === 0) {
      return { result: false, message: "유효한 단어가 없습니다." };
    }

    await handleConnect((prisma) =>
      prisma.chat_banned_word.createMany({
        data: tokens.map((word) => ({ word })),
        skipDuplicates: true,
      })
    );

    await sendChatAdminEvent({ kind: "config_changed" });
    return {
      result: true,
      message: `${tokens.length}개의 단어가 추가되었습니다.`,
    };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
