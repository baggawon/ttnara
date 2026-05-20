import {
  RequestValidator,
  requestValidator,
  makeMessagePayload,
  sendWebpush,
  webPushUserSelect,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { Prisma, thread } from "@prisma/client";
import { removeColumnsFromObject } from "@/helpers/basic";
import {
  deleteMultipleFilesFromS3,
  stripCloudFrontSignatures,
} from "@/helpers/server/s3";
import { BoardAccessService } from "@/lib/boardAccess";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { applyTopicPoints, getBalance } from "@/helpers/server/pointService";
import { PointAction } from "@/helpers/pointSystem";
import { recordActivity } from "@/helpers/server/boardActivity";
import { BoardActivityAction } from "@/helpers/boardActivity";
import { AlarmTypes, UserSettings } from "@/helpers/types";
import { attachMediaToContent } from "@/helpers/server/mediaAttach";
export interface threadUpdateProps extends thread {}

// Confirms the proposed thumbnail belongs to this author and is either an
// orphan (so the caller can request it be attached) or already attached to
// this thread. Returns the id when usable, else null.
const validateProposedThumbnail = async (
  authorId: string,
  threadId: number,
  proposedId: number | null | undefined
): Promise<number | null> => {
  if (proposedId == null) return null;
  const row = await handleConnect((prisma) =>
    prisma.media_upload.findFirst({
      where: {
        id: proposedId,
        author_id: authorId,
        media_type: "image",
        OR: [
          { attached_to_id: null },
          { attached_to_type: "thread", attached_to_id: threadId },
        ],
      },
      select: { id: true },
    })
  );
  return row ? row.id : null;
};

// Deletes the user's still-orphan media_uploads matching the client-declared
// unused list. Scoped to the author to prevent cross-user deletion, and to
// attached_to_id IS NULL so any row that got attached during this save (via
// content or thumbnail keep) is preserved.
const deleteUnusedOrphans = async (
  authorId: string,
  unusedIds: number[] | undefined
): Promise<void> => {
  if (!unusedIds || unusedIds.length === 0) return;
  const rows = await handleConnect((prisma) =>
    prisma.media_upload.findMany({
      where: {
        id: { in: unusedIds },
        author_id: authorId,
        attached_to_id: null,
      },
      select: { id: true, aws_cloud_front_url: true },
    })
  );
  if (!rows || rows.length === 0) return;

  await deleteMultipleFilesFromS3(
    rows.map(
      (r) => `https://${r.aws_cloud_front_url.replace(/^https?:\/\//, "")}`
    )
  );
  await handleConnect((prisma) =>
    prisma.media_upload.deleteMany({
      where: { id: { in: rows.map((r) => r.id) } },
    })
  );
};

const resolveThumbnailMediaId = async (
  threadId: number,
  proposedId: number | null | undefined
): Promise<number | null> => {
  if (proposedId == null) return null;
  const attached = await handleConnect((prisma) =>
    prisma.media_upload.findFirst({
      where: {
        id: proposedId,
        attached_to_type: "thread",
        attached_to_id: threadId,
        media_type: "image",
      },
      select: { id: true },
    })
  );
  return attached ? attached.id : null;
};

export const POST = async (formData: FormData) => {
  try {
    const jsonString = formData.get("json");
    if (!jsonString || !formData.get("topic_url")) throw ToastData.unknown;
    const parsed: threadUpdateProps & { unused_media_ids?: number[] } =
      JSON.parse(jsonString as string);
    const unusedMediaIds: number[] = Array.isArray(parsed.unused_media_ids)
      ? parsed.unused_media_ids.filter((n) => typeof n === "number")
      : [];
    const { unused_media_ids: _ignore, ...json } = parsed;
    void _ignore;
    if (typeof json?.id !== "number" || !json.content) throw ToastData.unknown;

    const topic_url = formData.get("topic_url") as string;

    const { uid, session } = await requestValidator(
      [RequestValidator.User],
      formData
    );
    const author_id = uid!;

    // Ensure cache is initialized
    if (!appCache.getByKey(CacheKey.Topics)) {
      await appCache.initializeFromDB();
    }

    try {
      const topics = appCache.getByKey(CacheKey.Topics) as any;
      const topicSettings = topics[topic_url];

      const access = await BoardAccessService.fromSession({
        session,
        topic_url,
        thread_id: json.id,
        topicSettings,
      });

      // 새글이라면
      if (json.id === 0 && !access.canWrite()) {
        return {
          result: false,
          message: "글 작성 권한이 없습니다",
        };
      }
      // 기존 글이라면
      if (json.id > 0 && !access.canEdit()) {
        return {
          result: false,
          message: "글 수정 권한이 없습니다",
        };
      }
      // 글 제목 검증
      if (!access.validateTitle(json.title)) {
        return {
          result: false,
          message: "글 제목이 최소/최대 범위를 벗어났습니다.",
        };
      }
      // 글 내용 검증
      if (!access.validateContent(json.content)) {
        return {
          result: false,
          message: "글 내용이 최소/최대 범위를 벗어났습니다.",
        };
      }

      // 익명 설정 검증:
      // - 토픽에서 익명을 허용하지 않으면 is_secret 강제 false
      // - 토픽에서 익명이 적용된 경우 모더레이터/관리자가 아닌 이상 is_secret 강제 true
      if (!topicSettings?.use_anonymous) {
        json.is_secret = false;
      } else if (!access.canModerate()) {
        json.is_secret = true;
      }

      // Gate negative points_per_post_create as a cost to the author.
      // Pre-check balance for UX; the atomic guard inside applyTopicPoints
      // catches races and triggers a rollback below.
      if (json.id === 0) {
        const createCost = topicSettings?.points_per_post_create ?? 0;
        if (createCost < 0) {
          const balance = await getBalance(author_id);
          if (balance < Math.abs(createCost)) {
            return { result: false, message: ToastData.insufficientPoints };
          }
        }
      }

      // Continue with creating thread...
    } catch (error: any) {
      console.error("Thread access control error:", error);
      return {
        result: false,
        message: error?.message ?? ToastData.threadAccessControlError,
      };
    }

    // Strip CloudFront signing params from content before saving to DB.
    // Markdown content from the new editor uses unsigned URLs; this is a
    // no-op there but still meaningful when editing legacy HTML threads.
    if (json.content) {
      json.content = stripCloudFrontSignatures(json.content);
    }

    if (json.id === 0) {
      const lastThread = await handleConnect((prisma) =>
        prisma.thread.findFirst({
          where: { topic_id: json.topic_id },
          select: { topic_order: true },
          orderBy: { topic_order: "desc" },
        })
      );
      const topic_order = lastThread ? lastThread.topic_order + 1 : 1;
      const data: Prisma.XOR<
        Prisma.threadCreateInput,
        Prisma.threadUncheckedCreateInput
      > = {
        ...removeColumnsFromObject(json, [
          "author",
          "id",
          "comments",
          "created_at",
          "updated_at",
          "images",
          "votes",
          "thumbnail_media",
          "thumbnail_media_id",
        ]),
        author_id,
        topic_order,
      };
      let createdThread: thread | null | undefined = null;
      try {
        createdThread = await handleConnect((prisma) =>
          prisma.thread.create({
            data,
          })
        );
        if (!createdThread) throw ToastData.threadCreatePrismaError;
      } catch (error) {
        data.topic_order = data.topic_order + 1;
        createdThread = await handleConnect((prisma) =>
          prisma.thread.create({
            data,
          })
        );
        if (!createdThread) throw ToastData.threadCreatePrismaError;
      }

      // Apply points (award or deduct) for post creation. On insufficient
      // balance the atomic guard fails — roll back the just-created thread
      // before media is attached, so we don't leave orphaned uploads.
      const ts = (appCache.getByKey(CacheKey.Topics) as any)?.[topic_url];
      const createAmount = ts?.points_per_post_create ?? 0;
      if (createdThread && createAmount !== 0) {
        const createdId = createdThread.id;
        const apply = await handleConnect((prisma) =>
          prisma.$transaction((tx) =>
            applyTopicPoints(tx, {
              uid: author_id,
              amount: createAmount,
              action: PointAction.post_create,
              topic_id: json.topic_id,
              thread_id: createdId,
            })
          )
        );
        if (!apply?.ok) {
          await handleConnect((prisma) =>
            prisma.thread.delete({ where: { id: createdId } })
          );
          return { result: false, message: ToastData.insufficientPoints };
        }
      }

      if (createdThread && json.content) {
        const keepId = await validateProposedThumbnail(
          author_id,
          createdThread.id,
          json.thumbnail_media_id
        );

        await attachMediaToContent({
          authorId: author_id,
          content: json.content,
          attachedToType: "thread",
          attachedToId: createdThread.id,
          isEdit: false,
          extraKeepIds: keepId != null ? [keepId] : [],
        });

        const resolvedThumbId = await resolveThumbnailMediaId(
          createdThread.id,
          json.thumbnail_media_id
        );
        if (resolvedThumbId != null) {
          await handleConnect((prisma) =>
            prisma.thread.update({
              where: { id: createdThread!.id },
              data: { thumbnail_media_id: resolvedThumbId },
            })
          );
        }

        await deleteUnusedOrphans(author_id, unusedMediaIds);
      }

      if (createdThread) {
        await recordActivity({
          uid: author_id,
          action: BoardActivityAction.post_create,
          topic_id: json.topic_id,
          thread_id: createdThread.id,
        });
      }

      // Admin broadcast push notification
      if (json.is_push_notify && createdThread) {
        const isAdmin = await handleConnect((prisma) =>
          prisma.profile.findUnique({
            where: { uid: author_id },
            select: { is_app_admin: true },
          })
        );
        if (isAdmin?.is_app_admin) {
          const users = await handleConnect((prisma) =>
            prisma.user.findMany({
              where: {
                id: { not: author_id },
                push_token: { isEmpty: false },
                NOT: {
                  settings: {
                    some: {
                      key: UserSettings.board_notification,
                      value: "false",
                    },
                  },
                },
              },
              select: webPushUserSelect,
            })
          );
          if (users && users.length > 0) {
            const payloads = users.map((u) =>
              makeMessagePayload({
                body: json.title,
                type: AlarmTypes.BoardAdminNotice,
                user: u,
                topic_url,
                thread_id: createdThread!.id,
              })
            );
            await sendWebpush(payloads, users);
          }
        }
      }
    } else {
      // Update thread first, then delete old media only on success
      const updateResult = await handleConnect((prisma) =>
        prisma.thread.update({
          where: {
            id: json.id,
          },
          data: {
            ...removeColumnsFromObject(json, [
              "author",
              "id",
              "comments",
              "created_at",
              "updated_at",
              "images",
              "votes",
              "topic",
              "views",
              "upvotes",
              "downvotes",
              "author_id",
              "thumbnail_media",
              "thumbnail_media_id",
            ]),
          },
        })
      );

      if (!updateResult) throw ToastData.unknown;

      const keepId = await validateProposedThumbnail(
        author_id,
        json.id,
        json.thumbnail_media_id
      );

      if (json.content) {
        await attachMediaToContent({
          authorId: author_id,
          content: json.content,
          attachedToType: "thread",
          attachedToId: json.id,
          isEdit: true,
          extraKeepIds: keepId != null ? [keepId] : [],
        });
      }

      const resolvedThumbId = await resolveThumbnailMediaId(
        json.id,
        json.thumbnail_media_id
      );
      await handleConnect((prisma) =>
        prisma.thread.update({
          where: { id: json.id },
          data: { thumbnail_media_id: resolvedThumbId },
        })
      );

      await deleteUnusedOrphans(author_id, unusedMediaIds);

      await recordActivity({
        uid: author_id,
        action: BoardActivityAction.post_edit,
        topic_id: json.topic_id,
        thread_id: json.id,
      });
    }

    return {
      result: true,
      message: json.id === 0 ? ToastData.threadCreate : ToastData.threadUpdate,
    };
  } catch (error) {
    console.log("error", error);
    return { result: false, message: String(error) };
  }
};
