import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface topicsDeleteProps {
  deleteTopicId: number;
}

export const POST = async (json: topicsDeleteProps) => {
  try {
    if (typeof json?.deleteTopicId !== "number") throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const deleteResult = await handleConnect((prisma) =>
      prisma.topic.delete({
        where: {
          id: json.deleteTopicId,
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
