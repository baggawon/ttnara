import { appCache, CacheKey } from "@/helpers/server/serverCache";
import {
  fetchLeaderboardFromDB,
  getCurrentPeriodKeys,
  type LeaderboardEntry,
} from "@/helpers/server/leaderboardService";

export interface LeaderboardReadProps {
  period?: string; // "total" | "daily" | "weekly"
  limit?: string;
  offset?: string;
}

export const GET = async (params: LeaderboardReadProps) => {
  try {
    const period = params.period ?? "total";
    const limit = Math.min(Number(params.limit) || 50, 100);
    const offset = Number(params.offset) || 0;

    let cacheKey: CacheKey;
    let periodType: string;
    let periodKey: string;

    switch (period) {
      case "daily": {
        cacheKey = CacheKey.LeaderboardDaily;
        periodType = "daily";
        periodKey = getCurrentPeriodKeys().daily;
        break;
      }
      case "weekly": {
        cacheKey = CacheKey.LeaderboardWeekly;
        periodType = "weekly";
        periodKey = getCurrentPeriodKeys().weekly;
        break;
      }
      default: {
        cacheKey = CacheKey.LeaderboardTotal;
        periodType = "total";
        periodKey = "all";
        break;
      }
    }

    // Try cache first
    let entries = appCache.getByKey(cacheKey) as LeaderboardEntry[] | undefined;

    // Cache miss — fetch from DB. Apply the same short TTL the refresh path
    // uses so silent post-trade refresh failures self-heal within 60s.
    if (!entries) {
      entries = await fetchLeaderboardFromDB(periodType, periodKey, 100);
      appCache.set(cacheKey, entries, 60);
    }

    // Apply pagination
    const paginated = entries.slice(offset, offset + limit);

    return {
      result: true,
      data: {
        entries: paginated,
        period_type: periodType,
        period_key: periodKey,
        total: entries.length,
      },
    };
  } catch (error) {
    console.error("Leaderboard read error:", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
