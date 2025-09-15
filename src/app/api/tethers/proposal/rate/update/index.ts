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

export interface TetherProposalRateUpdateProps extends tether_rate {}

export const POST = async (json: TetherProposalRateUpdateProps) => {
  try {
    if (typeof json?.id !== "number" || typeof json?.rate !== "number")
      throw ToastData.unknown;

    const { uid } = await requestValidator([RequestValidator.User], json);
    const user_id = uid!;

    if (json.id === 0) {
      const tetherProposal = await handleConnect((prisma) =>
        prisma.tether_proposal.findFirst({
          where: {
            id: json.tether_proposal_id,
          },
          select: {
            id: true,
            user_id: true,
            status: true,
            user: {
              select: webPushUserSelect,
            },
            tether: {
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
                status: true,
              },
            },
          },
        })
      );

      if (!tetherProposal) throw ToastData.unknown;

      const ownerConfirm =
        tetherProposal.tether.status === TetherStatus.Complete;

      const createResult = await handleConnect((prisma) =>
        prisma.tether_proposal.update({
          where: {
            id: json.tether_proposal_id,
          },
          data: {
            status: TetherProposalStatus.Complete,
            tether_rate: {
              create: {
                rate: json.rate,
                user_id,
              },
            },
          },
        })
      );

      if (!createResult) throw ToastData.unknown;

      if (ownerConfirm) {
        const rate = decimalToNumber(json.rate);
        const trade_count = decimalToNumber(
          tetherProposal.tether.user.trade_count
        );
        const trade_rate = decimalToNumber(
          tetherProposal.tether.user.trade_rate
        );
        const updateResult = await handleConnect((prisma) =>
          prisma.user.update({
            where: {
              id: tetherProposal.tether.user.id,
            },
            data: {
              trade_count: {
                increment: 1,
              },
              trade_rate: (trade_count * trade_rate + rate) / (trade_count + 1),
            },
          })
        );

        if (!updateResult) throw ToastData.unknown;

        const proposalPayload = makeMessagePayload({
          body: `${tetherProposal.tether?.user?.profile?.displayname}님, 거래완료!`,
          user: tetherProposal.tether.user,
          type: AlarmTypes.P2PComplete,
          tether_id: tetherProposal.tether.id,
        });

        const ownerPayload = makeMessagePayload({
          body: `${tetherProposal?.user?.profile?.displayname}님, 거래완료!`,
          user: tetherProposal.user,
          type: AlarmTypes.P2PComplete,
          tether_id: tetherProposal.tether.id,
        });

        await sendWebpush(
          [proposalPayload, ownerPayload],
          [tetherProposal.tether.user, tetherProposal.user]
        );
      }
    } else {
      throw ToastData.unknown;
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
