import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import { TetherStatus, TetherProposalStatus } from "@/helpers/types";

export interface CancelActiveTethersProps {}

export const POST = async (json: CancelActiveTethersProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const summary = await handleConnect((prisma) =>
      prisma.$transaction(async (tx) => {
        // Find all tethers that are not already cancelled or completed
        const targets = await tx.tether.findMany({
          where: {
            status: { notIn: [TetherStatus.Cancel, TetherStatus.Complete] },
          },
          select: { id: true, user_id: true },
        });

        if (targets.length === 0) {
          return { cancelledTethers: 0, cancelledProposals: 0 };
        }

        const tetherIds = targets.map((t) => t.id);

        // Snapshot proposers BEFORE cancelling so we can decrement their trade_joined
        const openProposals = await tx.tether_proposal.findMany({
          where: {
            tether_id: { in: tetherIds },
            status: TetherProposalStatus.Open,
          },
          select: { user_id: true },
        });

        // Cancel any open proposals on those tethers
        const proposalUpdate = await tx.tether_proposal.updateMany({
          where: {
            tether_id: { in: tetherIds },
            status: TetherProposalStatus.Open,
          },
          data: { status: TetherProposalStatus.Cancel },
        });

        // Cancel the tethers themselves
        await tx.tether.updateMany({
          where: { id: { in: tetherIds } },
          data: { status: TetherStatus.Cancel },
        });

        // Decrement trade_total per owner by their cancelled count
        const byOwner = new Map<string, number>();
        for (const t of targets) {
          byOwner.set(t.user_id, (byOwner.get(t.user_id) ?? 0) + 1);
        }
        for (const [ownerId, count] of byOwner.entries()) {
          await tx.user.update({
            where: { id: ownerId },
            data: { trade_total: { decrement: count } },
          });
        }

        // Decrement trade_joined per proposer by their cancelled count
        const byProposer = new Map<string, number>();
        for (const p of openProposals) {
          byProposer.set(p.user_id, (byProposer.get(p.user_id) ?? 0) + 1);
        }
        for (const [proposerId, count] of byProposer.entries()) {
          await tx.user.update({
            where: { id: proposerId },
            data: { trade_joined: { decrement: count } },
          });
        }

        return {
          cancelledTethers: targets.length,
          cancelledProposals: proposalUpdate.count,
        };
      })
    );

    if (!summary) throw ToastData.unknown;

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
