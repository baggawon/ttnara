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
import { refundThreadAuthor } from "@/helpers/server/pointService";
import { recordActivity } from "@/helpers/server/boardActivity";
import { BoardActivityAction } from "@/helpers/boardActivity";

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

    const { uid, session } = await requestValidator(
      [RequestValidator.User],
      json
    );
    const topics = appCache.getByKey(CacheKey.Topics) as any;
    const topicSettings = topics[json.topic_url];
    const topic_id = topics[json.topic_url].id;

    // Card-format home topics are managed exclusively from the admin-side
    // dedicated CRUD pages; reject deletes via the conventional flow.
    if (topicSettings?.fullview_on_homepage) {
      return {
        result: false,
        message:
          "메인 홈 카드형 게시판은 관리자 페이지에서만 삭제할 수 있습니다.",
      };
    }

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

    const threadMeta = await handleConnect((prisma) =>
      prisma.thread.findUnique({
        where: { id: json.deleteThreadId, topic_id },
        select: { id: true, author_id: true, created_at: true },
      })
    );

    const attachedMedia = await handleConnect((prisma) =>
      prisma.media_upload.findMany({
        where: {
          attached_to_type: "thread",
          attached_to_id: json.deleteThreadId,
        },
        select: { id: true, aws_cloud_front_url: true },
      })
    );

    const deleteResult = await handleConnect((prisma) =>
      prisma.thread.delete({
        where: {
          id: json.deleteThreadId,
          topic_id,
        },
        select: { id: true },
      })
    );
    if (!deleteResult) throw ToastData.unknown;

    // Anti-farming refund: only if the author deleted their own thread
    // within the refund window. Other earnings (readers, voters, commenters)
    // are not clawed back.
    if (
      threadMeta &&
      uid &&
      threadMeta.author_id === uid &&
      threadMeta.created_at
    ) {
      await refundThreadAuthor({
        thread_id: threadMeta.id,
        author_uid: threadMeta.author_id,
        created_at: threadMeta.created_at,
      });
    }

    if (uid) {
      await recordActivity({
        uid,
        action: BoardActivityAction.post_delete,
        topic_id,
        thread_id: json.deleteThreadId,
      });
    }

    if (attachedMedia && attachedMedia.length > 0) {
      const toDelete = map(
        attachedMedia,
        (image) => `https://${image.aws_cloud_front_url}`
      );

      const results = await deleteMultipleFilesFromS3(toDelete);
      if (results.failed.length > 0) {
        throw ToastData.unknown;
      }

      await handleConnect((prisma) =>
        prisma.media_upload.deleteMany({
          where: { id: { in: attachedMedia.map((m) => m.id) } },
        })
      );
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
