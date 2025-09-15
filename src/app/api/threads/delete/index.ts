import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { map } from "@/helpers/basic";
import { deleteMultipleFilesFromS3 } from "@/helpers/server/s3";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { BoardAccessService } from "@/lib/boardAccess";

export interface threadDeleteProps {
  deleteThreadId: number;
  topic_url: string;
}

export const POST = async (json: threadDeleteProps) => {
  try {
    if (
      typeof json?.deleteThreadId !== "number" ||
      typeof json?.topic_url !== "string"
    )
      throw ToastData.unknown;

    const { session } = await requestValidator([RequestValidator.User], json);
    const topics = appCache.getByKey(CacheKey.Topics) as any;
    const topicSettings = topics[json.topic_url];
    const topic_id = topics[json.topic_url].id;

    try {
      const access = await BoardAccessService.fromSession({
        session,
        topic_url: json.topic_url,
        thread_id: json.deleteThreadId,
        topicSettings,
      });

      if (!access.canDelete()) {
        throw ToastData.threadAccessControlError;
      }
    } catch (error) {
      return {
        result: false,
        message: ToastData.threadAccessControlError,
      };
    }

    const deleteResult = await handleConnect((prisma) =>
      prisma.thread.delete({
        where: {
          id: json.deleteThreadId,
          topic_id,
        },
        select: {
          images: true,
        },
      })
    );
    if (!deleteResult) throw ToastData.unknown;

    if (deleteResult.images.length > 0) {
      const toDelete = map(
        deleteResult.images,
        (image) => `https://${image.aws_cloud_front_url}`
      );

      const results = await deleteMultipleFilesFromS3(toDelete);
      if (results.failed.length > 0) {
        throw ToastData.unknown;
      }
    }

    return {
      result: true,
      message: ToastData.threadDelete,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
