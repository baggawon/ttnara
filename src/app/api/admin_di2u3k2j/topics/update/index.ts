import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { topic } from "@prisma/client";
// import { removeColumnsFromObject } from "@/helpers/basic";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface topicsUpdateProps extends topic {}

const RESERVED_TOPIC_URLS = ["tether"];

export const POST = async (json: topicsUpdateProps) => {
  try {
    if (typeof json?.id !== "number") throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    if (
      typeof json.url === "string" &&
      RESERVED_TOPIC_URLS.includes(json.url.trim().toLowerCase())
    ) {
      throw `'${json.url}' 경로는 예약된 경로입니다.`;
    }

    const { id, ...data } = json;
    const updateResult = await handleConnect((prisma) =>
      json.id === 0
        ? prisma.topic.create({
            data,
          })
        : prisma.topic.update({
            where: {
              id,
            },
            data,
          })
    );
    if (!updateResult) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.Topics);
    return {
      result: true,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
