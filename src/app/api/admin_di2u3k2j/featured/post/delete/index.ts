import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { map } from "@/helpers/basic";
import { deleteMultipleFilesFromS3 } from "@/helpers/server/s3";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { getSpecialTopic } from "@/helpers/server/specialBoard";

export interface FeaturedPostDeleteProps {
  id: number;
}

export interface FeaturedPostDeleteResult {
  id: number;
}

export const POST = async (json: FeaturedPostDeleteProps) => {
  try {
    if (typeof json?.id !== "number" || json.id <= 0) throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const topic = await getSpecialTopic();
    if (!topic) {
      return {
        result: false,
        message: "메인 홈 카드형 게시판이 지정되어 있지 않습니다.",
      };
    }

    // Scope to the current fullview topic so this endpoint can't delete
    // arbitrary threads from elsewhere.
    const existing = await handleConnect((prisma) =>
      prisma.thread.findFirst({
        where: { id: json.id, topic_id: topic.id },
        select: { id: true },
      })
    );
    if (!existing) {
      return { result: false, message: "게시글을 찾을 수 없습니다." };
    }

    // Comments + votes cascade via schema FKs on delete. media_upload is a
    // polymorphic reference (no FK), so its rows + S3 files are removed
    // explicitly below.
    const attachedMedia =
      (await handleConnect((prisma) =>
        prisma.media_upload.findMany({
          where: { attached_to_type: "thread", attached_to_id: json.id },
          select: { id: true, aws_cloud_front_url: true },
        })
      )) ?? [];

    const deleted = await handleConnect((prisma) =>
      prisma.thread.delete({
        where: { id: json.id },
        select: { id: true },
      })
    );
    if (!deleted) throw ToastData.unknown;

    if (attachedMedia.length > 0) {
      // Remove the polymorphic media_upload rows first so the DB is fully
      // consistent with the now-deleted thread, then clean S3 as a best-effort
      // last step. S3 failures are logged rather than thrown: the thread is
      // already gone, so throwing here would report a false error AND (as the
      // previous ordering did) skip the media_upload cleanup, leaving orphaned
      // rows pointing at a deleted thread. Leftover S3 objects are harmless.
      await handleConnect((prisma) =>
        prisma.media_upload.deleteMany({
          where: { id: { in: attachedMedia.map((m) => m.id) } },
        })
      );
      const toDelete = map(
        attachedMedia,
        (m) => `https://${m.aws_cloud_front_url}`
      );
      const results = await deleteMultipleFilesFromS3(toDelete);
      if (results.failed.length > 0) {
        console.log(
          "featured post delete: S3 cleanup partial failure",
          results.failed
        );
      }
    }

    await appCache.refreshCache(CacheKey.Topics);

    return {
      result: true,
      data: { id: deleted.id } as FeaturedPostDeleteResult,
    };
  } catch (error) {
    console.log("featured post delete error", error);
    return { result: false, message: String(error) };
  }
};
