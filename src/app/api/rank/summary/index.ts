import { handleConnect } from "@/helpers/server/prisma";
import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { TetherProposalStatus, TetherStatus } from "@/helpers/types";
import { PointKind } from "@/helpers/pointSystem";
import { signStoredCloudFrontUrl } from "@/helpers/server/s3";

const signBadge = (raw: string | null): string | null =>
  raw ? signStoredCloudFrontUrl(raw) : null;

export interface RankViewItem {
  rank_level: number;
  name: string | null;
  min_value: number;
  badge_image: string | null;
}

export interface RankStat {
  label: string;
  value: number;
  unit: string;
}

// A normalized, metric-agnostic view consumed by <RankProgression />.
// Both board rank and trade rank produce this same shape so the component
// renders without any metric-specific branching.
export interface RankView {
  ranks: RankViewItem[];
  current: {
    value: number;
    rank_level: number;
    rank_name: string | null;
    rank_image: string | null;
  };
  heroLabel: string; // "총 거래횟수" | "총 게시판 포인트"
  unitLabel: string; // "회" | "P"
  progressDescription: string;
  statsTitle: string;
  statsDescription: string;
  stats: RankStat[];
}

export interface RankSummaryResponse {
  displayname: string;
  // null when no trade ranks are configured (board-only deployment)
  trade: RankView | null;
  board: RankView;
}

export const GET = async (queryParams: any) => {
  try {
    const { uid } = await requestValidator(
      [RequestValidator.User],
      queryParams
    );
    if (!uid) throw ToastData.noAuth;

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);
    // Calendar-month-to-date for the board "이번 달" stats.
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedWhere = (since: Date) => ({
      status: TetherStatus.Complete,
      updated_at: { gte: since },
      OR: [
        { user_id: uid },
        {
          tether_proposals: {
            some: { user_id: uid, status: TetherProposalStatus.Complete },
          },
        },
      ],
    });

    const result = await handleConnect((prisma) =>
      Promise.all([
        prisma.trade_rank.findMany({
          where: { is_active: true },
          orderBy: { rank_level: "asc" },
          select: {
            rank_level: true,
            name: true,
            min_trade_count: true,
            badge_image: true,
          },
        }),
        prisma.board_rank.findMany({
          where: { is_active: true },
          orderBy: { rank_level: "asc" },
          select: {
            rank_level: true,
            name: true,
            min_point: true,
            badge_image: true,
          },
        }),
        prisma.user.findUnique({
          where: { id: uid },
          select: {
            trade_count: true,
            profile: {
              select: {
                displayname: true,
                point: true,
                current_rank_level: true,
                current_rank_name: true,
                current_rank_image: true,
                current_board_rank_level: true,
                current_board_rank_name: true,
                current_board_rank_image: true,
              },
            },
          },
        }),
        prisma.tether.count({ where: completedWhere(todayStart) }),
        prisma.tether.count({ where: completedWhere(weekAgo) }),
        prisma.tether.count({ where: completedWhere(monthAgo) }),
        prisma.thread.count({
          where: { author_id: uid, created_at: { gte: monthStart } },
        }),
        prisma.comment.count({
          where: { author_id: uid, created_at: { gte: monthStart } },
        }),
        prisma.point_history.aggregate({
          _sum: { amount: true },
          where: {
            uid,
            kind: PointKind.earn,
            ref_type: "attendance",
            created_at: { gte: monthStart },
          },
        }),
      ])
    );

    if (!result) throw ToastData.unknown;
    const [
      tradeRanks,
      boardRanks,
      user,
      today,
      week,
      month,
      threadCount,
      commentCount,
      attendanceAgg,
    ] = result;
    if (!user) throw ToastData.unknown;

    const profile = user.profile;
    const tradeCount = user.trade_count;
    const point = profile?.point ?? 0;
    const attendancePoints = attendanceAgg._sum.amount ?? 0;

    const tradeView: RankView | null =
      tradeRanks.length === 0
        ? null
        : {
            ranks: tradeRanks.map((r) => ({
              rank_level: r.rank_level,
              name: r.name,
              min_value: r.min_trade_count,
              badge_image: signBadge(r.badge_image),
            })),
            current: {
              value: tradeCount,
              rank_level: profile?.current_rank_level ?? 1,
              rank_name: profile?.current_rank_name ?? null,
              rank_image: signBadge(profile?.current_rank_image ?? null),
            },
            heroLabel: "총 거래횟수",
            unitLabel: "회",
            progressDescription: "거래 횟수 조건을 달성 시 자동 등업됩니다.",
            statsTitle: "기간별 거래 횟수",
            statsDescription: "최근 기간 동안 완료한 거래 횟수입니다.",
            stats: [
              { label: "금일 거래 횟수", value: today, unit: "회" },
              { label: "최근 1주일 거래 횟수", value: week, unit: "회" },
              { label: "최근 1개월 거래 횟수", value: month, unit: "회" },
            ],
          };

    const boardView: RankView = {
      ranks: boardRanks.map((r) => ({
        rank_level: r.rank_level,
        name: r.name,
        min_value: r.min_point,
        badge_image: signBadge(r.badge_image),
      })),
      current: {
        value: point,
        rank_level: profile?.current_board_rank_level ?? 1,
        rank_name: profile?.current_board_rank_name ?? null,
        rank_image: signBadge(profile?.current_board_rank_image ?? null),
      },
      heroLabel: "총 게시판 포인트",
      unitLabel: "P",
      progressDescription: "게시판 포인트 조건을 달성 시 자동 등업됩니다.",
      statsTitle: "이번 달 활동",
      statsDescription: "이번 달 게시판 활동 내역입니다.",
      stats: [
        { label: "이번 달 게시글", value: threadCount, unit: "개" },
        { label: "이번 달 댓글", value: commentCount, unit: "개" },
        { label: "이번 달 출석 포인트", value: attendancePoints, unit: "P" },
      ],
    };

    const response: RankSummaryResponse = {
      displayname: profile?.displayname ?? "",
      trade: tradeView,
      board: boardView,
    };

    return { result: true, data: response };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
