import {
  makeMessagePayload,
  RequestValidator,
  requestValidator,
  sendWebpush,
  webPushUserSelect,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { tether_rate } from "@prisma/client";
import { decimalToNumber } from "@/helpers/common";
import {
  AlarmTypes,
  TetherProposalStatus,
  TetherStatus,
} from "@/helpers/types";
import { evaluateRankLevel } from "@/helpers/server/rankEvaluator";
import {
  broadcastLeaderboardUpdate,
  refreshAllLeaderboardCaches,
  upsertLeaderboardEntries,
} from "@/helpers/server/leaderboardService";

export interface TetherProposalRateUpdateProps extends tether_rate {}

export const POST = async (json: TetherProposalRateUpdateProps) => {
  try {
    if (typeof json?.id !== "number" || typeof json?.rate !== "number")
      throw ToastData.unknown;

    const { uid } = await requestValidator([RequestValidator.User], json);
    const user_id = uid!;

    // Ratings are immutable. Only id===0 (create) is supported.
    if (json.id !== 0) throw ToastData.unknown;

    const result = await handleConnect(async (prisma) => {
      const proposal = await prisma.tether_proposal.findFirst({
        where: { id: json.tether_proposal_id },
        select: {
          id: true,
          user_id: true,
          user: {
            select: {
              trade_count: true,
              trade_rate: true,
              ...webPushUserSelect,
            },
          },
          tether: {
            select: {
              id: true,
              user_id: true,
              status: true,
              user: {
                select: {
                  trade_count: true,
                  trade_rate: true,
                  ...webPushUserSelect,
                },
              },
            },
          },
          tether_rate: {
            select: { user_id: true },
          },
        },
      });

      if (!proposal) return { error: ToastData.unknown as any };
      if (proposal.tether.status === TetherStatus.Cancel)
        return { error: ToastData.tetherAlreadyCancel as any };
      if (proposal.tether.status === TetherStatus.Complete)
        return { error: ToastData.tetherAlreadyComplete as any };

      const ownerId = proposal.tether.user_id;
      const proposerId = proposal.user_id;
      if (user_id !== ownerId && user_id !== proposerId)
        return { error: ToastData.unknown as any };

      // Friendly guard for the common double-click case; the DB unique
      // constraint is still the authoritative backstop against races.
      if (proposal.tether_rate.some((r) => r.user_id === user_id))
        return { error: ToastData.unknown as any };

      const finalized = await prisma.$transaction(async (tx) => {
        // Unique constraint (user_id, tether_proposal_id) blocks double-rating
        // at the DB layer; any race here throws and aborts the transaction.
        await tx.tether_rate.create({
          data: {
            rate: json.rate,
            user_id,
            tether_proposal_id: json.tether_proposal_id,
          },
        });

        const rateRows = await tx.tether_rate.findMany({
          where: { tether_proposal_id: json.tether_proposal_id },
          select: { user_id: true, rate: true },
        });
        if (rateRows.length < 2) return false;

        // Atomic "exactly-once" gate — only the request that flips the
        // status can run increments. Prevents concurrent double-increment.
        const flipped = await tx.tether.updateMany({
          where: {
            id: proposal.tether.id,
            status: { not: TetherStatus.Complete },
          },
          data: { status: TetherStatus.Complete },
        });
        if (flipped.count !== 1) return false;

        await tx.tether_proposal.update({
          where: { id: proposal.id },
          data: { status: TetherProposalStatus.Complete },
        });

        // Each party's received rating = the rating SUBMITTED by the other.
        const ownerRow = rateRows.find((r) => r.user_id === proposerId);
        const proposerRow = rateRows.find((r) => r.user_id === ownerId);
        if (!ownerRow || !proposerRow) return false;
        const ratingForOwner = decimalToNumber(ownerRow.rate);
        const ratingForProposer = decimalToNumber(proposerRow.rate);

        const ownerCount = decimalToNumber(proposal.tether.user.trade_count);
        const ownerAvg = decimalToNumber(proposal.tether.user.trade_rate);
        const proposerCount = decimalToNumber(proposal.user.trade_count);
        const proposerAvg = decimalToNumber(proposal.user.trade_rate);

        const ownerNewCount = ownerCount + 1;
        const ownerNewAvg =
          (ownerCount * ownerAvg + ratingForOwner) / ownerNewCount;
        const proposerNewCount = proposerCount + 1;
        const proposerNewAvg =
          (proposerCount * proposerAvg + ratingForProposer) / proposerNewCount;

        await tx.user.update({
          where: { id: ownerId },
          data: { trade_count: { increment: 1 }, trade_rate: ownerNewAvg },
        });
        await tx.user.update({
          where: { id: proposerId },
          data: { trade_count: { increment: 1 }, trade_rate: proposerNewAvg },
        });

        const ownerRank = await evaluateRankLevel(tx, ownerNewCount);
        await tx.profile.update({
          where: { uid: ownerId },
          data: {
            current_rank_level: ownerRank.rank_level,
            current_rank_name: ownerRank.name,
            current_rank_image: ownerRank.badge_image,
          },
        });

        const proposerRank = await evaluateRankLevel(tx, proposerNewCount);
        await tx.profile.update({
          where: { uid: proposerId },
          data: {
            current_rank_level: proposerRank.rank_level,
            current_rank_name: proposerRank.name,
            current_rank_image: proposerRank.badge_image,
          },
        });

        await upsertLeaderboardEntries(
          tx,
          ownerId,
          ownerNewCount,
          ownerNewAvg,
          ownerRank.rank_level,
          { skipBroadcast: true }
        );
        await upsertLeaderboardEntries(
          tx,
          proposerId,
          proposerNewCount,
          proposerNewAvg,
          proposerRank.rank_level,
          { skipBroadcast: true }
        );

        return true;
      });

      return { finalized, proposal };
    });

    if (!result || (result as any).error)
      throw (result as any)?.error ?? ToastData.unknown;

    const { finalized, proposal } = result as {
      finalized: boolean;
      proposal: any;
    };

    // Post-commit side effects (broadcast + push).
    if (finalized) {
      await refreshAllLeaderboardCaches();
      broadcastLeaderboardUpdate();

      const ownerCompletePayload = makeMessagePayload({
        body: `${proposal.tether.user?.profile?.displayname}님, 거래완료!`,
        user: proposal.tether.user,
        type: AlarmTypes.P2PComplete,
        tether_id: proposal.tether.id,
      });
      const proposerCompletePayload = makeMessagePayload({
        body: `${proposal.user?.profile?.displayname}님, 거래완료!`,
        user: proposal.user,
        type: AlarmTypes.P2PComplete,
        tether_id: proposal.tether.id,
      });

      await sendWebpush(
        [ownerCompletePayload, proposerCompletePayload],
        [proposal.tether.user, proposal.user]
      );
    } else {
      // First rater — nudge the other party to rate.
      const otherParty =
        user_id === proposal.tether.user_id
          ? proposal.user
          : proposal.tether.user;

      const ratePrompt = makeMessagePayload({
        body: `${otherParty?.profile?.displayname}님, 상대방이 거래를 완료했습니다. 평가해주세요.`,
        user: otherParty,
        type: AlarmTypes.P2PRateRequest,
        tether_id: proposal.tether.id,
      });

      await sendWebpush([ratePrompt], [otherParty]);
    }

    return {
      result: true,
      message: ToastData.threadProposalRateCreate,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
