import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isoWeek from "dayjs/plugin/isoWeek";
import { handleConnect } from "./prisma";
import { appCache, CacheKey } from "./serverCache";
import { userUpdateEmitter } from "@/lib/eventEmitter";
import { QueryKey, TetherProposalStatus } from "@/helpers/types";
import { decimalToNumber } from "@/helpers/common";
import { signStoredCloudFrontUrl } from "./s3";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

const KST = "Asia/Seoul";

export interface LeaderboardEntry {
  uid: string;
  displayname: string;
  rank_level: number;
  rank_image: string | null;
  board_rank_level: number;
  board_rank_name: string | null;
  board_rank_image: string | null;
  ranking_point: number;
  trade_count: number;
  trade_rate: number;
  position: number;
  prev_position: number | null; // null = new entry
  updated_at: Date;
}

export function computeRankingPoint(
  tradeCount: number,
  tradeRate: number,
  rankLevel: number
): number {
  const activity = Math.log10(tradeCount + 1) * 30;
  const quality = tradeRate * (tradeCount / (tradeCount + 10)) * 20;
  const prestige = Math.log10(rankLevel + 1) * 15;
  return activity + quality + prestige;
}

export function getCurrentPeriodKeys(): { daily: string; weekly: string } {
  const now = dayjs().tz(KST);
  return {
    daily: now.format("YYYYMMDD"),
    weekly: `${now.isoWeekYear()}:${String(now.isoWeek()).padStart(2, "0")}`,
  };
}

function getCurrentPeriodBounds(): {
  daily: { start: Date; end: Date };
  weekly: { start: Date; end: Date };
} {
  const now = dayjs().tz(KST);
  return {
    daily: {
      start: now.startOf("day").toDate(),
      end: now.add(1, "day").startOf("day").toDate(),
    },
    weekly: {
      start: now.startOf("isoWeek").toDate(),
      end: now.add(1, "week").startOf("isoWeek").toDate(),
    },
  };
}

// Counts completed trades for `uid` whose completion time (the later of the
// two ratings on the proposal) falls within [start, end), and averages the
// rating the user received on those trades.
async function computePeriodTradeStats(
  prisma: any,
  uid: string,
  start: Date,
  end: Date
): Promise<{ tradeCount: number; tradeRate: number }> {
  const rows = await prisma.tether_rate.findMany({
    where: {
      tether_proposal: {
        status: TetherProposalStatus.Complete,
        OR: [{ user_id: uid }, { tether: { user_id: uid } }],
      },
    },
    select: {
      tether_proposal_id: true,
      user_id: true,
      rate: true,
      created_at: true,
    },
  });

  const byProposal = new Map<
    number,
    { user_id: string; rate: any; created_at: Date }[]
  >();
  for (const row of rows as any[]) {
    const arr = byProposal.get(row.tether_proposal_id) ?? [];
    arr.push(row);
    byProposal.set(row.tether_proposal_id, arr);
  }

  const startMs = start.getTime();
  const endMs = end.getTime();
  let count = 0;
  let sum = 0;
  for (const arr of byProposal.values()) {
    if (arr.length < 2) continue;
    const completionMs = arr.reduce(
      (m, r) => Math.max(m, r.created_at.getTime()),
      0
    );
    if (completionMs < startMs || completionMs >= endMs) continue;
    const received = arr.find((r) => r.user_id !== uid);
    if (!received) continue;
    count += 1;
    sum += decimalToNumber(received.rate);
  }

  return {
    tradeCount: count,
    tradeRate: count > 0 ? sum / count : 0,
  };
}

export async function upsertLeaderboardEntries(
  prisma: any,
  uid: string,
  tradeCount: number,
  tradeRate: number,
  rankLevel: number,
  options?: { skipBroadcast?: boolean }
): Promise<void> {
  const { daily, weekly } = getCurrentPeriodKeys();
  const bounds = getCurrentPeriodBounds();

  const dailyStats = await computePeriodTradeStats(
    prisma,
    uid,
    bounds.daily.start,
    bounds.daily.end
  );
  const weeklyStats = await computePeriodTradeStats(
    prisma,
    uid,
    bounds.weekly.start,
    bounds.weekly.end
  );

  const periods: {
    type: string;
    key: string;
    cacheKey: CacheKey;
    tradeCount: number;
    tradeRate: number;
  }[] = [
    {
      type: "total",
      key: "all",
      cacheKey: CacheKey.LeaderboardTotal,
      tradeCount,
      tradeRate,
    },
    {
      type: "daily",
      key: daily,
      cacheKey: CacheKey.LeaderboardDaily,
      tradeCount: dailyStats.tradeCount,
      tradeRate: dailyStats.tradeRate,
    },
    {
      type: "weekly",
      key: weekly,
      cacheKey: CacheKey.LeaderboardWeekly,
      tradeCount: weeklyStats.tradeCount,
      tradeRate: weeklyStats.tradeRate,
    },
  ];

  for (const {
    type,
    key,
    cacheKey,
    tradeCount: tc,
    tradeRate: tr,
  } of periods) {
    const rankingPoint = computeRankingPoint(tc, tr, rankLevel);
    const cachedEntries =
      (appCache.getByKey(cacheKey) as LeaderboardEntry[] | undefined) ?? [];
    const currentPosition =
      cachedEntries.find((e) => e.uid === uid)?.position ?? null;

    await prisma.leaderboard_entry.upsert({
      where: {
        uid_period_type_period_key: {
          uid,
          period_type: type,
          period_key: key,
        },
      },
      create: {
        uid,
        period_type: type,
        period_key: key,
        ranking_point: rankingPoint,
        trade_count: tc,
        trade_rate: tr,
        rank_level: rankLevel,
        prev_position: null,
      },
      update: {
        ranking_point: rankingPoint,
        trade_count: tc,
        trade_rate: tr,
        rank_level: rankLevel,
        prev_position: currentPosition,
      },
    });
  }

  if (options?.skipBroadcast) return;

  await refreshAllLeaderboardCaches();
  broadcastLeaderboardUpdate();
}

export function broadcastLeaderboardUpdate() {
  userUpdateEmitter.emit("userUpdate", {
    userId: "관리자",
    data: { queryKey: QueryKey.leaderboard },
  });
}

export async function refreshAllLeaderboardCaches(): Promise<void> {
  await Promise.all([
    appCache.refreshCache(CacheKey.LeaderboardTotal),
    appCache.refreshCache(CacheKey.LeaderboardDaily),
    appCache.refreshCache(CacheKey.LeaderboardWeekly),
  ]);
}

export async function fetchLeaderboardFromDB(
  periodType: string,
  periodKey: string,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  const entries = await handleConnect((prisma: any) =>
    prisma.leaderboard_entry.findMany({
      where: {
        period_type: periodType,
        period_key: periodKey,
        ranking_point: { gt: 0 },
      },
      orderBy: [{ ranking_point: "desc" }, { updated_at: "asc" }],
      take: limit,
      include: {
        user: {
          select: {
            profile: {
              select: {
                displayname: true,
                current_rank_level: true,
                current_rank_image: true,
                current_board_rank_level: true,
                current_board_rank_name: true,
                current_board_rank_image: true,
              },
            },
          },
        },
      },
    })
  );

  if (!entries) return [];

  return (entries as any[]).map((entry: any, index: number) => {
    const stored = entry.user?.profile?.current_rank_image ?? null;
    const boardStored = entry.user?.profile?.current_board_rank_image ?? null;
    return {
      uid: entry.uid,
      displayname: entry.user?.profile?.displayname ?? "",
      rank_level: entry.rank_level,
      rank_image: stored ? signStoredCloudFrontUrl(stored) : null,
      board_rank_level: entry.user?.profile?.current_board_rank_level ?? 1,
      board_rank_name: entry.user?.profile?.current_board_rank_name ?? null,
      board_rank_image: boardStored
        ? signStoredCloudFrontUrl(boardStored)
        : null,
      ranking_point: Number(entry.ranking_point),
      trade_count: entry.trade_count,
      trade_rate: Number(entry.trade_rate),
      position: index + 1,
      prev_position: entry.prev_position ?? null,
      updated_at: entry.updated_at,
    };
  });
}

export async function seedTotalLeaderboard(): Promise<void> {
  const users = await handleConnect((prisma: any) =>
    prisma.user.findMany({
      where: { trade_count: { gt: 0 } },
      select: {
        id: true,
        trade_count: true,
        trade_rate: true,
        profile: {
          select: { current_rank_level: true },
        },
      },
    })
  );

  if (!users || users.length === 0) return;

  await handleConnect((prisma: any) =>
    prisma.$transaction(
      (users as any[]).map((user: any) => {
        const tradeCount = user.trade_count;
        const tradeRate = Number(user.trade_rate);
        const rankLevel = user.profile?.current_rank_level ?? 1;
        const rankingPoint = computeRankingPoint(
          tradeCount,
          tradeRate,
          rankLevel
        );

        return prisma.leaderboard_entry.upsert({
          where: {
            uid_period_type_period_key: {
              uid: user.id,
              period_type: "total",
              period_key: "all",
            },
          },
          create: {
            uid: user.id,
            period_type: "total",
            period_key: "all",
            ranking_point: rankingPoint,
            trade_count: tradeCount,
            trade_rate: tradeRate,
            rank_level: rankLevel,
            prev_position: null,
          },
          update: {
            ranking_point: rankingPoint,
            trade_count: tradeCount,
            trade_rate: tradeRate,
            rank_level: rankLevel,
          },
        });
      })
    )
  );
}
