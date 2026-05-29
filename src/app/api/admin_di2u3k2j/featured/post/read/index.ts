import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { getSpecialTopic } from "@/helpers/server/specialBoard";
import { signStoredCloudFrontUrl } from "@/helpers/server/s3";
import type { thread } from "@prisma/client";
import type { MediaUploadResult } from "@/app/api/uploads/media";

export interface FeaturedPostReadProps {
  id: string | number;
}

export interface FeaturedPostReadResult {
  post: thread;
  attachedMedia: MediaUploadResult[];
}

export const GET = async (queryParams: FeaturedPostReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const id = Number(queryParams.id);
    if (!Number.isFinite(id) || id <= 0) throw ToastData.unknown;

    // Scope to the current fullview topic so admins can't read posts from
    // unrelated boards via this endpoint.
    const topic = await getSpecialTopic();
    if (!topic) {
      return {
        result: false,
        message: "메인 홈 카드형 게시판이 지정되어 있지 않습니다.",
      };
    }

    const post = await handleConnect((prisma) =>
      prisma.thread.findFirst({
        where: { id, topic_id: topic.id },
      })
    );
    if (!post) {
      return { result: false, message: "게시글을 찾을 수 없습니다." };
    }

    const mediaRows = await handleConnect((prisma) =>
      prisma.media_upload.findMany({
        where: { attached_to_type: "thread", attached_to_id: id },
        orderBy: { uploaded_at: "asc" },
      })
    );

    const attachedMedia: MediaUploadResult[] = (mediaRows ?? []).map((row) => ({
      id: row.id,
      url: signStoredCloudFrontUrl(row.aws_cloud_front_url),
      awsCloudFrontUrl: row.aws_cloud_front_url,
      mediaType: row.media_type === "video" ? "video" : "image",
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
    }));

    return {
      result: true,
      data: { post, attachedMedia } as FeaturedPostReadResult,
    };
  } catch (error) {
    console.log("featured post read error", error);
    return { result: false, message: String(error) };
  }
};
