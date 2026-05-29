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

export interface FeaturedPostUpdateProps {
  id: number;
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

export interface FeaturedPostUpdateResult {
  id: number;
}

export const POST = async (json: FeaturedPostUpdateProps) => {
  try {
    if (typeof json?.id !== "number" || json.id <= 0 || !json?.title?.trim()) {
      throw ToastData.unknown;
    }

    const { uid } = await requestValidator([RequestValidator.Admin], json);
    const author_id = uid;
    if (!author_id) {
      return { result: false, message: "관리자 인증이 필요합니다." };
    }

    const topic = await getSpecialTopic();
    if (!topic) {
      return {
        result: false,
        message: "메인 홈 카드형 게시판이 지정되어 있지 않습니다.",
      };
    }

    // Confirm the post belongs to the current fullview topic so we can't update
    // arbitrary threads from elsewhere via this endpoint.
    const existing = await handleConnect((prisma) =>
      prisma.thread.findFirst({
        where: { id: json.id, topic_id: topic.id },
        select: { id: true, author_id: true },
      })
    );
    if (!existing) {
      return { result: false, message: "게시글을 찾을 수 없습니다." };
    }

    const content = stripCloudFrontSignatures(json.content ?? "");
    const categoryId = json.category_id ? Number(json.category_id) : null;

    // Validate the proposed thumbnail before content attachment so we can
    // include it in the keep list (so attachMediaToContent won't strip it).
    const keepId = await validateProposedThumbnail(
      existing.author_id,
      json.id,
      json.thumbnail_media_id
    );

    // Re-attach any uploads referenced in the new body; uploads no longer
    // referenced will fall out and be picked up by the orphan sweep below.
    await attachMediaToContent({
      authorId: existing.author_id,
      content,
      attachedToType: "thread",
      attachedToId: json.id,
      isEdit: true,
      extraKeepIds: keepId != null ? [keepId] : [],
    });

    const resolvedThumbId = await resolveThumbnailMediaId(
      json.id,
      json.thumbnail_media_id
    );

    const updated = await handleConnect((prisma) =>
      prisma.thread.update({
        where: { id: json.id },
        data: {
          title: json.title.trim(),
          description: json.description?.trim() || null,
          content,
          content_format: json.content_format,
          category_id: categoryId,
          thumbnail_media_id: resolvedThumbId,
          action_url_1: json.action_url_1?.trim() || null,
          action_url_1_label: json.action_url_1_label?.trim() || null,
          action_url_2: json.action_url_2?.trim() || null,
          action_url_2_label: json.action_url_2_label?.trim() || null,
          is_featured: !!json.is_featured,
        },
      })
    );
    if (!updated) throw ToastData.unknown;

    await deleteUnusedOrphans(existing.author_id, json.unused_media_ids);
    await appCache.refreshCache(CacheKey.Topics);

    return {
      result: true,
      data: { id: updated.id } as FeaturedPostUpdateResult,
    };
  } catch (error) {
    console.log("featured post update error", error);
    return { result: false, message: String(error) };
  }
};
