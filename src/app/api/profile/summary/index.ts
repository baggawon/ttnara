import { handleConnect } from "@/helpers/server/prisma";
import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { signStoredCloudFrontUrl } from "@/helpers/server/s3";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { kstToday } from "@/helpers/server/attendanceTime";
import type { attendance_setting } from "@prisma/client";

export interface ProfileSummaryResponse {
  displayname: string;
  boardRank: {
    configured: boolean; // false when no active board ranks exist yet
    level: number;
    name: string | null;
    image: string | null;
    nextName: string | null; // null at the highest rank
    progress: number; // 0..100 toward the next rank (100 at max)
    isMax: boolean;
  };
  postCount: number;
  point: number;
  attendance: {
    enabled: boolean;
    dailyPoints: number;
    checkedToday: boolean;
  };
}

export const GET = async (queryParams: any) => {
  try {
    const { uid } = await requestValidator(
      [RequestValidator.User],
      queryParams
    );
    if (!uid) throw ToastData.noAuth;

    const today = kstToday();

    const result = await handleConnect((prisma) =>
      Promise.all([
        prisma.profile.findUnique({
          where: { uid },
          select: {
            displayname: true,
            point: true,
            current_board_rank_level: true,
            current_board_rank_name: true,
            current_board_rank_image: true,
          },
        }),
        prisma.thread.count({ where: { author_id: uid } }),
        prisma.attendance_record.findUnique({
          where: { uid_kst_date: { uid, kst_date: today } },
          select: { id: true },
        }),
        prisma.board_rank.findMany({
          where: { is_active: true },
          orderBy: { min_point: "asc" },
          select: {
            rank_level: true,
            name: true,
            min_point: true,
            badge_image: true,
          },
        }),
      ])
    );

    if (!result) throw ToastData.unknown;
    const [profile, postCount, todayRecord, ranks] = result;
    if (!profile) throw ToastData.unknown;

    const setting = appCache.getByKey(CacheKey.AttendanceSetting) as
      | attendance_setting
      | null
      | undefined;

    const point = profile.point ?? 0;
    const boardRank = computeBoardRankProgress(point, ranks);

    const response: ProfileSummaryResponse = {
      displayname: profile.displayname ?? "",
      boardRank,
      postCount,
      point,
      attendance: {
        enabled: setting?.is_enabled ?? true,
        dailyPoints: setting?.daily_points ?? 0,
        checkedToday: !!todayRecord,
      },
    };

    return { result: true, data: response };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};

interface RankRow {
  rank_level: number;
  name: string | null;
  min_point: number;
  badge_image: string | null;
}

/**
 * Derive the user's current board rank and progress toward the next one from
 * the live board_rank table (not the denormalized snapshot, so the bar always
 * matches the configured thresholds). Ranks arrive sorted by min_point asc.
 */
function computeBoardRankProgress(
  point: number,
  ranks: RankRow[]
): ProfileSummaryResponse["boardRank"] {
  if (!ranks || ranks.length === 0) {
    return {
      configured: false,
      level: 1,
      name: null,
      image: null,
      nextName: null,
      progress: 0,
      isMax: false,
    };
  }

  // Current = highest rank whose threshold the user meets. If the user is below
  // the lowest threshold, treat the lowest rank as the (not-yet-reached) target.
  let currentIdx = -1;
  for (let i = 0; i < ranks.length; i++) {
    if (point >= ranks[i].min_point) currentIdx = i;
    else break;
  }

  const current = currentIdx >= 0 ? ranks[currentIdx] : null;
  const next = ranks[currentIdx + 1] ?? null;
  const isMax = currentIdx === ranks.length - 1;

  const currentMin = current?.min_point ?? 0;
  const nextMin = next?.min_point ?? null;

  let progress = 100;
  if (nextMin !== null) {
    const span = nextMin - currentMin;
    progress = span > 0 ? ((point - currentMin) / span) * 100 : 0;
    progress = Math.max(0, Math.min(100, Math.round(progress)));
  }

  return {
    configured: true,
    level: current?.rank_level ?? ranks[0].rank_level,
    name: current?.name ?? null,
    image: current?.badge_image
      ? signStoredCloudFrontUrl(current.badge_image)
      : null,
    nextName: next?.name ?? null,
    progress,
    isMax,
  };
}
