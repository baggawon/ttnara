import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface topicCategoriesDeleteProps {
  deleteCategoryId: number;
}

export const POST = async (json: topicCategoriesDeleteProps) => {
  try {
    if (typeof json?.deleteCategoryId !== "number") throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    // Resolve the owning topic. Home card-type boards sync their categories from
    // an external source, so manual deletion is disallowed.
    const category = await handleConnect((prisma) =>
      prisma.category.findUnique({
        where: { id: json.deleteCategoryId },
        select: { topic: { select: { fullview_on_homepage: true } } },
      })
    );
    if (!category) throw ToastData.unknown;
    if (category.topic.fullview_on_homepage) {
      throw ToastData.adminTopicCategoryHomeLocked;
    }

    const deleteResult = await handleConnect((prisma) =>
      prisma.category.delete({
        where: {
          id: json.deleteCategoryId,
        },
      })
    );
    if (!deleteResult) throw ToastData.unknown;

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
