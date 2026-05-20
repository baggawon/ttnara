import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import { evaluateRankLevel } from "@/helpers/server/rankEvaluator";
import {
  broadcastLeaderboardUpdate,
  refreshAllLeaderboardCaches,
} from "@/helpers/server/leaderboardService";

export interface ResetTradeRecordsProps {}

export const POST = async (json: ResetTradeRecordsProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const summary = await handleConnect((prisma) =>
      prisma.$transaction(async (tx) => {
        // 1. Wipe all trade records (rates → proposals → region selections → tethers)
        const ratesDeleted = await tx.tether_rate.deleteMany({});
        const proposalsDeleted = await tx.tether_proposal.deleteMany({});
        await tx.tether_region_selection.deleteMany({});
        const tethersDeleted = await tx.tether.deleteMany({});

        // 2. Reset all user trade counters
        const usersReset = await tx.user.updateMany({
          data: {
            trade_total: 0,
            trade_count: 0,
            trade_joined: 0,
            trade_rate: 0,
          },
        });

        // 3. Reset all profile ranks to the default (zero-trade) tier
        const zeroRank = await evaluateRankLevel(tx, 0);
        await tx.profile.updateMany({
          data: {
            current_rank_level: zeroRank.rank_level,
            current_rank_name: zeroRank.name,
            current_rank_image: zeroRank.badge_image,
          },
        });

        // 4. Wipe leaderboard
        const leaderboardDeleted = await tx.leaderboard_entry.deleteMany({});

        return {
          ratesDeleted: ratesDeleted.count,
          proposalsDeleted: proposalsDeleted.count,
          tethersDeleted: tethersDeleted.count,
          usersReset: usersReset.count,
          leaderboardDeleted: leaderboardDeleted.count,
        };
      })
    );

    if (!summary) throw ToastData.unknown;

    // Refresh leaderboard caches and broadcast
    await refreshAllLeaderboardCaches();
    broadcastLeaderboardUpdate();

    return {
      result: true,
      data: summary,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
