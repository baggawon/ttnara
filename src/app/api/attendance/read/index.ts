import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import {
  kstToday,
  kstYesterday,
  kstCurrentMonth,
  kstMonthRange,
} from "@/helpers/server/attendanceTime";
import { signStoredCloudFrontUrl } from "@/helpers/server/s3";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { PointAction } from "@/helpers/pointSystem";
import type { attendance_setting } from "@prisma/client";

export interface AttendanceReadProps {
  month?: string; // "YYYY-MM"
  feedPage?: number;
  feedPageSize?: number;
}

export interface AttendanceMilestone {
  id: number;
  day_count: number;
  bonus_points: number;
  label: string | null;
}

export interface AttendanceFeedItem {
  comment: string;
  comment_format: string;
  created_at: Date;
  kst_date: string;
  displayname: string;
  rank_image: string | null;
}

export interface AttendanceReadResult {
  setting: { is_enabled: boolean; daily_points: number };
  milestones: AttendanceMilestone[];
  month: string;
  monthDates: string[];
  stats: {
    consecutiveDays: number;
    monthCount: number;
    checkedToday: boolean;
    cyclePosition: number;
    todayAwarded: number;
    lifetimeEarned: number;
  };
  feed: {
    items: AttendanceFeedItem[];
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

const DEFAULT_FEED_SIZE = 20;
const MAX_FEED_SIZE = 50;

export const GET = async (queryParams: AttendanceReadProps) => {
  try {
    const { uid } = await requestValidator(
      [RequestValidator.User],
      queryParams
    );
    if (!uid) throw ToastData.noAuth;

    const month =
      typeof queryParams.month === "string" &&
      /^\d{4}-\d{2}$/.test(queryParams.month)
        ? queryParams.month
        : kstCurrentMonth();
    const { start, end } = kstMonthRange(month);

    const feedPage = Math.max(1, Number(queryParams.feedPage) || 1);
    const feedPageSize = Math.min(
      MAX_FEED_SIZE,
      Math.max(1, Number(queryParams.feedPageSize) || DEFAULT_FEED_SIZE)
    );

    const today = kstToday();
    const yesterday = kstYesterday();

    let setting = appCache.getByKey(CacheKey.AttendanceSetting) as
      | attendance_setting
      | null
      | undefined;
    if (!setting) {
      setting = await handleConnect((prisma) =>
        prisma.attendance_setting.findFirst({ orderBy: { id: "asc" } })
      );
    }

    const data = await handleConnect((prisma) =>
      Promise.all([
        prisma.attendance_streak.findMany({
          where: { is_active: true },
          orderBy: { day_count: "asc" },
          select: {
            id: true,
            day_count: true,
            bonus_points: true,
            label: true,
          },
        }),
        // This user's records for the requested month (calendar marks).
        prisma.attendance_record.findMany({
          where: { uid, kst_date: { gte: start, lte: end } },
          select: { kst_date: true },
        }),
        // Today / yesterday rows for the streak stats.
        prisma.attendance_record.findUnique({
          where: { uid_kst_date: { uid, kst_date: today } },
          select: {
            consecutive_day: true,
            cycle_position: true,
            base_points: true,
            bonus_points: true,
          },
        }),
        prisma.attendance_record.findUnique({
          where: { uid_kst_date: { uid, kst_date: yesterday } },
          select: { consecutive_day: true },
        }),
        // Public feed page + total.
        prisma.attendance_record.findMany({
          orderBy: { created_at: "desc" },
          skip: (feedPage - 1) * feedPageSize,
          take: feedPageSize,
          select: {
            comment: true,
            comment_format: true,
            created_at: true,
            kst_date: true,
            user: {
              select: {
                profile: {
                  select: {
                    displayname: true,
                    current_board_rank_image: true,
                  },
                },
              },
            },
          },
        }),
        prisma.attendance_record.count(),
        // Lifetime points earned via attendance only (base check-in + streak
        // bonus). Same wallet as board points, but scoped to attendance actions.
        prisma.point_history.aggregate({
          where: {
            uid,
            action: {
              in: [
                PointAction.daily_checkin,
                PointAction.attendance_streak_bonus,
              ],
            },
            amount: { gt: 0 },
          },
          _sum: { amount: true },
        }),
      ])
    );

    if (!data) throw ToastData.unknown;
    const [
      streaks,
      monthRows,
      todayRow,
      yesterdayRow,
      feedRows,
      feedTotal,
      lifetimeAgg,
    ] = data;

    const maxDay = streaks.length ? streaks[streaks.length - 1].day_count : 0;

    const checkedToday = !!todayRow;
    const consecutiveDays = todayRow
      ? todayRow.consecutive_day
      : yesterdayRow
        ? yesterdayRow.consecutive_day
        : 0;
    const cyclePosition = todayRow
      ? todayRow.cycle_position
      : maxDay > 0
        ? (consecutiveDays % maxDay) + 1
        : consecutiveDays + 1;
    const todayAwarded = todayRow
      ? todayRow.base_points + todayRow.bonus_points
      : 0;

    const result: AttendanceReadResult = {
      setting: {
        is_enabled: setting?.is_enabled ?? true,
        daily_points: setting?.daily_points ?? 0,
      },
      milestones: streaks,
      month,
      monthDates: monthRows.map((r) => r.kst_date),
      stats: {
        consecutiveDays,
        monthCount: monthRows.length,
        checkedToday,
        cyclePosition,
        todayAwarded,
        lifetimeEarned: lifetimeAgg._sum.amount ?? 0,
      },
      feed: {
        items: feedRows.map((r) => ({
          comment: r.comment,
          comment_format: r.comment_format,
          created_at: r.created_at,
          kst_date: r.kst_date,
          displayname: r.user?.profile?.displayname ?? "",
          rank_image: r.user?.profile?.current_board_rank_image
            ? signStoredCloudFrontUrl(r.user.profile.current_board_rank_image)
            : null,
        })),
        currentPage: feedPage,
        pageSize: feedPageSize,
        totalItems: feedTotal,
        totalPages: Math.ceil(feedTotal / feedPageSize),
      },
    };

    return { result: true, data: result };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
