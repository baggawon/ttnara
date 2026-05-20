import { appCache, CacheKey } from "@/helpers/server/serverCache";
import {
  getCurrentPeriodKeys,
  type LeaderboardEntry,
} from "@/helpers/server/leaderboardService";
import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";

export interface UserRankingData {
  ranking_point: number;
  position: number | null;
}

export interface UserRankingResponse {
  total: UserRankingData;
  daily: UserRankingData;
  weekly: UserRankingData;
}

function findUserInCache(cacheKey: CacheKey, uid: string): UserRankingData {
  const entries = appCache.getByKey(cacheKey) as LeaderboardEntry[] | undefined;
  if (entries) {
    const entry = entries.find((e) => e.uid === uid);
    if (entry) {
      return {
        ranking_point: entry.ranking_point,
        position: entry.position,
      };
    }
  }
  return { ranking_point: 0, position: null };
}

async function findUserInDB(
  uid: string,
  periodType: string,
  periodKey: string
): Promise<UserRankingData> {
  const entry = await handleConnect((prisma) =>
    prisma.leaderboard_entry.findUnique({
      where: {
        uid_period_type_period_key: {
          uid,
          period_type: periodType,
          period_key: periodKey,
        },
      },
      select: { ranking_point: true },
    })
  );

  if (entry) {
    return {
      ranking_point: Number(entry.ranking_point),
      position: null, // outside cached top list
    };
  }
  return { ranking_point: 0, position: null };
}

export const GET = async (queryParams: any) => {
  try {
    const { uid } = await requestValidator(
      [RequestValidator.User],
      queryParams
    );

    const { daily, weekly } = getCurrentPeriodKeys();

    // Try cache first, fall back to DB
    let totalData = findUserInCache(CacheKey.LeaderboardTotal, uid!);
    if (totalData.ranking_point === 0 && totalData.position === null) {
      totalData = await findUserInDB(uid!, "total", "all");
    }

    let dailyData = findUserInCache(CacheKey.LeaderboardDaily, uid!);
    if (dailyData.ranking_point === 0 && dailyData.position === null) {
      dailyData = await findUserInDB(uid!, "daily", daily);
    }

    let weeklyData = findUserInCache(CacheKey.LeaderboardWeekly, uid!);
    if (weeklyData.ranking_point === 0 && weeklyData.position === null) {
      weeklyData = await findUserInDB(uid!, "weekly", weekly);
    }

    const response: UserRankingResponse = {
      total: totalData,
      daily: dailyData,
      weekly: weeklyData,
    };

    return {
      result: true,
      data: response,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
