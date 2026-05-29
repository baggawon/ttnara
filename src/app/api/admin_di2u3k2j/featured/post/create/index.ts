import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { stripCloudFrontSignatures } from "@/helpers/server/s3";
import { attachMediaToContent } from "@/helpers/server/mediaAttach";
import {
  deleteUnusedOrphans,
  resolveThumbnailMediaId,
  validateProposedThumbnail,
} from "@/helpers/server/threadMedia";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { getSpecialTopic } from "@/helpers/server/specialBoard";
import { getAmadoEvents } from "@/helpers/server/amado/amadoApi";
import type { Prisma } from "@prisma/client";

export interface FeaturedPostCreateProps {
  amado_event_id: string;
  title: string;
  description: string;
  content: string;
  content_format: "markdown" | "html";
  category_id: string;
  thumbnail_media_id: number | null;
  action_url_1: string;
  action_url_1_label: string;
  action_url_2: string;
  action_url_2_label: string;
  is_featured: boolean;
  unused_media_ids?: number[];
}

export interface FeaturedPostCreateResult {
  id: number;
}

export const POST = async (json: FeaturedPostCreateProps) => {
  try {
    if (!json?.amado_event_id || !json?.title?.trim()) {
      throw ToastData.unknown;
    }

    const { uid } = await requestValidator([RequestValidator.Admin], json);
    const author_id = uid;
    if (!author_id) {
      return { result: false, message: "관리자 인증이 필요합니다." };
    }

    // Always derive the target topic from the live fullview-topic flag so an
    // admin can't aim this at an arbitrary topic by tampering with the body.
    const topic = await getSpecialTopic();
    if (!topic) {
      return {
        result: false,
        message: "메인 홈 카드형 게시판이 지정되어 있지 않습니다.",
      };
    }

    // Reject if this Amado event already has a post in this topic — the
    // schema's @@unique([topic_id, amado_event_id]) enforces this too, but
    // a friendly message here beats a 500.
    const existing = await handleConnect((prisma) =>
      prisma.thread.findFirst({
        where: {
          topic_id: topic.id,
          amado_event_id: json.amado_event_id,
        },
        select: { id: true },
      })
    );
    if (existing) {
      return {
        result: false,
        message: "이미 이 이벤트로 작성된 게시글이 있습니다.",
      };
    }

    const content = stripCloudFrontSignatures(json.content ?? "");
    const categoryId = json.category_id ? Number(json.category_id) : null;

    // Snapshot the source event's resolution date so the user-end can flag the
    // post "expired" by date later without re-hitting Amado. Best-effort: if the
    // feed is unreachable the read-path reconciliation fills it in on next view.
    let amadoEndDate: Date | null = null;
    try {
      const liveEvent = (await getAmadoEvents()).find(
        (e) => e.id === json.amado_event_id
      );
      if (liveEvent?.moment_of_truth) {
        amadoEndDate = new Date(liveEvent.moment_of_truth);
      }
    } catch {
      // leave null
    }

    // Determine next topic_order, mirroring the regular thread create path.
    const lastThread = await handleConnect((prisma) =>
      prisma.thread.findFirst({
        where: { topic_id: topic.id },
        select: { topic_order: true },
        orderBy: { topic_order: "desc" },
      })
    );
    let topic_order = lastThread ? lastThread.topic_order + 1 : 1;

    const baseData: Prisma.threadUncheckedCreateInput = {
      title: json.title.trim(),
      description: json.description?.trim() || null,
      content,
      content_format: json.content_format,
      author_id,
      topic_id: topic.id,
      topic_order,
      category_id: categoryId,
      is_secret: false,
      is_blocked: false,
      is_notice: false,
      is_push_notify: false,
      action_url_1: json.action_url_1?.trim() || null,
      action_url_1_label: json.action_url_1_label?.trim() || null,
      action_url_2: json.action_url_2?.trim() || null,
      action_url_2_label: json.action_url_2_label?.trim() || null,
      is_featured: !!json.is_featured,
      amado_event_id: json.amado_event_id,
      amado_event_end_date: amadoEndDate,
      amado_event_removed: false,
    };

    let created;
    try {
      created = await handleConnect((prisma) =>
        prisma.thread.create({ data: baseData })
      );
    } catch {
      // Retry once if the topic_order race triggered the unique constraint.
      topic_order = topic_order + 1;
      created = await handleConnect((prisma) =>
        prisma.thread.create({ data: { ...baseData, topic_order } })
      );
    }
    if (!created) throw ToastData.threadCreatePrismaError;

    // Attach uploads referenced in the body + thumbnail. Mirrors the regular
    // thread create flow but skipping points/anonymity since neither applies
    // to admin-authored fullview posts.
    if (content) {
      const keepId = await validateProposedThumbnail(
        author_id,
        created.id,
        json.thumbnail_media_id
      );
      await attachMediaToContent({
        authorId: author_id,
        content,
        attachedToType: "thread",
        attachedToId: created.id,
        isEdit: false,
        extraKeepIds: keepId != null ? [keepId] : [],
      });

      const resolvedThumbId = await resolveThumbnailMediaId(
        created.id,
        json.thumbnail_media_id
      );
      if (resolvedThumbId != null) {
        await handleConnect((prisma) =>
          prisma.thread.update({
            where: { id: created.id },
            data: { thumbnail_media_id: resolvedThumbId },
          })
        );
      }

      await deleteUnusedOrphans(author_id, json.unused_media_ids);
    }

    await appCache.refreshCache(CacheKey.Topics);

    return {
      result: true,
      data: { id: created.id } as FeaturedPostCreateResult,
    };
  } catch (error) {
    console.log("featured post create error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
