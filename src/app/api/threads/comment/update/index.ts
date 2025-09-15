import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { comment } from "@prisma/client";
import { removeColumnsFromObject } from "@/helpers/basic";
import { BoardAccessService } from "@/lib/boardAccess";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface CommentUpdateProps extends comment {
  topic_url: string;
}

export const POST = async (json: CommentUpdateProps) => {
  try {
    if (typeof json?.id !== "number" || !json.content) throw ToastData.unknown;

    const { uid, session } = await requestValidator(
      [RequestValidator.User],
      json
    );

    const author_id = uid!;
    const { topic_url, ...jsonData } = json;

    try {
      const topics = appCache.getByKey(CacheKey.Topics) as any;

      // First check if topic exists
      const topicSettings = topics[topic_url];

      const access = await BoardAccessService.fromSession({
        session,
        topic_url,
        thread_id: json.thread_id,
        topicSettings,
      });

      if (!access.canComment()) {
        // return new Response("Forbidden", { status: 403 });
        return {
          result: false,
          message: "댓글 등록 권한이 없습니다",
        };
      }

      if (!access.validateComment(jsonData.content)) {
        // return new Response("Invalid title length", { status: 400 });
        return {
          result: false,
          message: "댓글이 최대 길이를 초과했습니다.",
        };
      }

      // Continue with creating thread...
    } catch (error) {
      return {
        result: false,
        message: ToastData.unknown,
      };
    }

    if (json.id === 0) {
      const createResult = await handleConnect((prisma) =>
        prisma.comment.create({
          data: {
            ...removeColumnsFromObject(jsonData, [
              "id",
              "created_at",
              "updated_at",
            ]),
            author_id,
          },
        })
      );

      if (!createResult) throw ToastData.unknown;
    } else {
      const updateResult = await handleConnect((prisma) =>
        prisma.comment.update({
          where: {
            id: json.id,
            thread_id: json.thread_id,
            author_id,
          },
          data: {
            ...removeColumnsFromObject(jsonData, [
              "id",
              "created_at",
              "updated_at",
            ]),
          },
        })
      );

      if (!updateResult) throw ToastData.unknown;
    }

    return {
      result: true,
      message:
        json.id === 0 ? ToastData.commentCreate : ToastData.commentUpdate,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
