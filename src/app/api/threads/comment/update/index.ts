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
import { applyTopicPoints, getBalance } from "@/helpers/server/pointService";
import { PointAction } from "@/helpers/pointSystem";
import { recordActivity } from "@/helpers/server/boardActivity";
import { BoardActivityAction } from "@/helpers/boardActivity";
import { enqueueCommentNotification } from "@/helpers/server/notificationQueue";
import { sanitizeStoredHtml } from "@/helpers/server/sanitizeHtml";

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

    // Comment bodies are rendered as HTML (dangerouslySetInnerHTML on the
    // thread page), so sanitize on write to neutralize injected scripts.
    if (jsonData.content) {
      jsonData.content = sanitizeStoredHtml(jsonData.content);
    }

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

    let createdComment: comment | null = null;

    if (json.id === 0) {
      const ts = (appCache.getByKey(CacheKey.Topics) as any)?.[topic_url];
      const commentAmount = ts?.points_per_comment_create ?? 0;

      // Gate negative cost as a precheck for clearer UX.
      if (commentAmount < 0) {
        const balance = await getBalance(author_id);
        if (balance < Math.abs(commentAmount)) {
          return { result: false, message: ToastData.insufficientPoints };
        }
      }

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
      createdComment = createResult;

      // Apply points; if the atomic guard fails (race), roll back the comment.
      if (commentAmount !== 0) {
        const createdId = createResult.id;
        const apply = await handleConnect((prisma) =>
          prisma.$transaction((tx) =>
            applyTopicPoints(tx, {
              uid: author_id,
              amount: commentAmount,
              action: PointAction.comment_create,
              topic_id: ts?.id,
              thread_id: json.thread_id,
              comment_id: createdId,
            })
          )
        );
        if (!apply?.ok) {
          await handleConnect((prisma) =>
            prisma.comment.delete({ where: { id: createdId } })
          );
          return { result: false, message: ToastData.insufficientPoints };
        }
      }

      await recordActivity({
        uid: author_id,
        action: BoardActivityAction.comment_create,
        topic_id: ts?.id,
        thread_id: json.thread_id,
        comment_id: createResult.id,
      });

      // Enqueue comment notification for thread author
      await enqueueCommentNotification({
        commenter_id: author_id,
        thread_id: json.thread_id,
        topic_url,
        topic_id: ts?.id,
      });
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

      const ts = (appCache.getByKey(CacheKey.Topics) as any)?.[topic_url];
      await recordActivity({
        uid: author_id,
        action: BoardActivityAction.comment_edit,
        topic_id: ts?.id,
        thread_id: json.thread_id,
        comment_id: json.id,
      });
    }

    return {
      result: true,
      message:
        json.id === 0 ? ToastData.commentCreate : ToastData.commentUpdate,
      data: createdComment ?? undefined,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
