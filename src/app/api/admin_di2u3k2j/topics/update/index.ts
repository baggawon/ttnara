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
    // Only one topic at a time may hold `fullview_on_homepage` (the special-board
    // home block keys off this single flag). Auto-demote any prior holder in the
    // same transaction so admins don't have to manually unset it.
    const updateResult = await handleConnect((prisma) =>
      prisma.$transaction(async (tx) => {
        if (data.fullview_on_homepage === true) {
          await tx.topic.updateMany({
            where: {
              fullview_on_homepage: true,
              ...(json.id !== 0 ? { NOT: { id } } : {}),
            },
            data: { fullview_on_homepage: false },
          });
        }
        return json.id === 0
          ? tx.topic.create({ data })
          : tx.topic.update({ where: { id }, data });
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
