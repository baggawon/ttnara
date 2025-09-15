import { map } from "@/helpers/basic";
import { getNickname } from "@/helpers/common";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import type { Message } from "@/helpers/types";

export const convertMessageData = (data: Message[], column: string) =>
  map(data, (message) => {
    let messageData = getNickname((message as any)[column]);
    messageData += `\n${dayjs(message.created_at).tz("Asia/Seoul").format("YY-MM-DD HH:mm")}`;
    messageData += `\n${message.contents.replace("\n", "")}`;
    return {
      ...message,
      messageData,
    };
  });
