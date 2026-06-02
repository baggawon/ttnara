import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { category } from "@prisma/client";
import { removeColumnsFromObject } from "@/helpers/basic";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface topicCategoriesUpdateProps extends category {}

export const POST = async (json: topicCategoriesUpdateProps) => {
  try {
    if (typeof json?.id !== "number") throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    // Home card-type boards sync their categories from an external source, so
    // manual create/edit is disallowed. On create the owning topic comes from
    // the payload; on update it's resolved from the existing category so a
    // forged topic_id can't bypass the guard.
    const topicId =
      json.id === 0
        ? json.topic_id
        : (
            await handleConnect((prisma) =>
              prisma.category.findUnique({
                where: { id: json.id },
                select: { topic_id: true },
              })
            )
          )?.topic_id;
    if (typeof topicId === "number") {
      const topic = await handleConnect((prisma) =>
        prisma.topic.findUnique({
          where: { id: topicId },
          select: { fullview_on_homepage: true },
        })
      );
      if (topic?.fullview_on_homepage) {
        throw ToastData.adminTopicCategoryHomeLocked;
      }
    }

    const updateResult = await handleConnect((prisma) =>
      json.id === 0
        ? prisma.category.create({
            data: {
              ...removeColumnsFromObject(json, [
                "id",
                "created_at",
                "updated_at",
              ]),
            },
          })
        : prisma.category.update({
            where: {
              id: json.id,
            },
            data: {
              ...removeColumnsFromObject(json, [
                "id",
                "created_at",
                "updated_at",
              ]),
            },
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
