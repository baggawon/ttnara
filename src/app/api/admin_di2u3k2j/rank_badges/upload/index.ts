import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { uploadFileToS3, signStoredCloudFrontUrl } from "@/helpers/server/s3";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import type { RankBadgeAssignConflict } from "@/app/api/admin_di2u3k2j/rank_badges/assign";

export const RANK_BADGE_MAX_BYTES = 2 * 1024 * 1024;

export const ALLOWED_RANK_BADGE_MIME_TYPES = new Set<string>([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
]);

export interface RankBadgeUploadResult {
  ok: boolean;
  id?: number;
  name?: string | null;
  url?: string;
  assigned_min_rank?: number | null;
  assigned_max_rank?: number | null;
  conflict?: RankBadgeAssignConflict[];
  description?: string;
}

export const POST = async (formData: FormData) => {
  try {
    await requestValidator([RequestValidator.Admin], formData);

    const file = formData.get("file");
    const name = (formData.get("name") as string | null)?.trim() || null;
    const rangeStartRaw = formData.get("rangeStart") as string | null;
    const rangeEndRaw = formData.get("rangeEnd") as string | null;
    const hasRange = rangeStartRaw !== null && rangeEndRaw !== null;
    const rangeStart = hasRange ? Number(rangeStartRaw) : null;
    const rangeEnd = hasRange ? Number(rangeEndRaw) : null;

    if (!(file instanceof File) || file.size === 0) {
      return { result: false, message: "No file provided" };
    }

    if (file.size > RANK_BADGE_MAX_BYTES) {
      return {
        result: false,
        message: `File too large (max ${RANK_BADGE_MAX_BYTES / 1024 / 1024}MB)`,
      };
    }

    if (!ALLOWED_RANK_BADGE_MIME_TYPES.has(file.type)) {
      return { result: false, message: `Unsupported file type: ${file.type}` };
    }

    // When set, the previous badge owner that should be orphaned after upload.
    let replaceBadgeId: number | null = null;

    if (hasRange) {
      if (
        rangeStart === null ||
        rangeEnd === null ||
        !Number.isFinite(rangeStart) ||
        !Number.isFinite(rangeEnd) ||
        rangeStart > rangeEnd ||
        rangeStart < 1
      ) {
        return { result: false, message: ToastData.rankBadgeRangeInvalid };
      }

      // Pre-check for conflicts BEFORE uploading to avoid orphan S3 objects.
      const existing = await handleConnect((prisma) =>
        prisma.trade_rank.findMany({
          where: {
            rank_level: { gte: rangeStart, lte: rangeEnd },
            badge_image: { not: null },
          },
          select: { rank_level: true, badge_image: true },
          orderBy: { rank_level: "asc" },
        })
      );

      if (existing && existing.length > 0) {
        const uniqueUrls = new Set(
          existing.map((e) => e.badge_image as string)
        );
        // Multiple distinct badges across this range — refuse outright.
        if (uniqueUrls.size > 1) {
          const levels = existing.map((c) => c.rank_level).join(", ");
          const data: RankBadgeUploadResult = {
            ok: false,
            conflict: existing,
            description: `등급 ${levels}에 다른 이미지가 할당되어 있습니다.`,
          };
          return { result: true, data };
        }

        // Single badge currently covers this range. Replace is allowed
        // ONLY if its assignment is exactly this range (single-owner case).
        const sharedUrl = [...uniqueUrls][0];
        const oldBadge = await handleConnect((prisma) =>
          prisma.rank_badge_image.findFirst({
            where: { aws_cloud_front_url: sharedUrl },
          })
        );

        if (
          oldBadge &&
          (oldBadge.assigned_min_rank !== rangeStart ||
            oldBadge.assigned_max_rank !== rangeEnd)
        ) {
          const levels = existing.map((c) => c.rank_level).join(", ");
          const data: RankBadgeUploadResult = {
            ok: false,
            conflict: existing,
            description: `등급 ${levels}에 다른 범위의 이미지가 할당되어 있습니다. 배지 이미지 관리에서 먼저 해제해주세요.`,
          };
          return { result: true, data };
        }

        // Stash the badge id to orphan after upload (or null if stale ref).
        replaceBadgeId = oldBadge?.id ?? null;
      }
    }

    const uploaded = await uploadFileToS3(file, "rank-badges");
    if (!uploaded?.aws_cloud_front_url || !uploaded?.aws_url) {
      throw ToastData.unknown;
    }

    const row = await handleConnect(async (prisma) => {
      return await prisma.$transaction(async (tx) => {
        const created = await tx.rank_badge_image.create({
          data: {
            name,
            aws_url: uploaded.aws_url,
            aws_cloud_front_url: uploaded.aws_cloud_front_url,
            mime_type: file.type,
            size_bytes: file.size,
            ...(hasRange && {
              assigned_min_rank: rangeStart,
              assigned_max_rank: rangeEnd,
            }),
          },
        });

        if (hasRange && rangeStart !== null && rangeEnd !== null) {
          await tx.trade_rank.updateMany({
            where: { rank_level: { gte: rangeStart, lte: rangeEnd } },
            data: { badge_image: uploaded.aws_cloud_front_url },
          });
        }

        if (replaceBadgeId !== null) {
          await tx.rank_badge_image.update({
            where: { id: replaceBadgeId },
            data: {
              assigned_min_rank: null,
              assigned_max_rank: null,
            },
          });
        }

        return created;
      });
    });
    if (!row) throw ToastData.unknown;

    if (hasRange) await appCache.refreshCache(CacheKey.TradeRanks);

    const data: RankBadgeUploadResult = {
      ok: true,
      id: row.id,
      name: row.name,
      url: signStoredCloudFrontUrl(row.aws_cloud_front_url),
      assigned_min_rank: row.assigned_min_rank,
      assigned_max_rank: row.assigned_max_rank,
    };

    return { result: true, data };
  } catch (error) {
    console.error("rank badge upload error:", error);
    return {
      result: false,
      message: typeof error === "string" ? error : String(error),
    };
  }
};
