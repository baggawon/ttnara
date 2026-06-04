import { handleConnect } from "@/helpers/server/prisma";
import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { TetherProposalStatus, TetherStatus } from "@/helpers/types";
import { signStoredCloudFrontUrl } from "@/helpers/server/s3";

const signBadge = (raw: string | null): string | null =>
  raw ? signStoredCloudFrontUrl(raw) : null;

export interface RankSummaryItem {
  rank_level: number;
  name: string | null;
  min_trade_count: number;
  badge_image: string | null;
}

export interface RankSummaryResponse {
  ranks: RankSummaryItem[];
  user: {
    trade_count: number;
    trade_total: number;
    trade_joined: number;
    current_rank_level: number;
    current_rank_name: string | null;
    current_rank_image: string | null;
    current_board_rank_level: number;
    current_board_rank_name: string | null;
    current_board_rank_image: string | null;
    displayname: string;
  };
  periodCounts: {
    today: number;
    week: number;
    month: number;
  };
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
        prisma.user.findUnique({
          where: { id: uid },
          select: {
            trade_count: true,
            trade_total: true,
            trade_joined: true,
            profile: {
              select: {
                displayname: true,
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
      ])
    );

    if (!result) throw ToastData.unknown;
    const [ranks, user, today, week, month] = result;
    if (!user) throw ToastData.unknown;

    const response: RankSummaryResponse = {
      ranks: ranks.map((r) => ({
        ...r,
        badge_image: signBadge(r.badge_image),
      })),
      user: {
        trade_count: user.trade_count,
        trade_total: user.trade_total,
        trade_joined: user.trade_joined,
        current_rank_level: user.profile?.current_rank_level ?? 1,
        current_rank_name: user.profile?.current_rank_name ?? null,
        current_rank_image: signBadge(user.profile?.current_rank_image ?? null),
        current_board_rank_level: user.profile?.current_board_rank_level ?? 1,
        current_board_rank_name: user.profile?.current_board_rank_name ?? null,
        current_board_rank_image: signBadge(
          user.profile?.current_board_rank_image ?? null
        ),
        displayname: user.profile?.displayname ?? "",
      },
      periodCounts: { today, week, month },
    };

    return { result: true, data: response };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
