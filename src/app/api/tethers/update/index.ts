import {
  makeMessagePayload,
  RequestValidator,
  requestValidator,
  sendWebpush,
  webPushUserSelect,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { tether, tether_proposal } from "@prisma/client";
import { removeColumnsFromObject } from "@/helpers/basic";
import type { SimpleProfile } from "@/app/api/threads/read";
import {
  AlarmTypes,
  TetherProposalStatus,
  TetherStatus,
} from "@/helpers/types";
import { decimalToNumber } from "@/helpers/common";

export interface TetherUpdateProps extends tether {
  user: SimpleProfile | null;
  tether_proposals: TetherProposals[];
}

export interface TetherProposals extends tether_proposal {
  user: SimpleProfile | null;
}

export const POST = async (json: TetherUpdateProps) => {
  try {
    if (typeof json?.id !== "number") throw ToastData.unknown;

    const { uid } = await requestValidator([RequestValidator.User], json);
    const user_id = uid!;

    if (json.id === 0) {
      const createResult = await handleConnect((prisma) =>
        prisma.$transaction([
          prisma.tether.create({
            data: {
              ...removeColumnsFromObject(json, [
                "user_id",
                "_count",
                "user",
                "id",
                "tether_proposals",
                "created_at",
                "updated_at",
              ]),
              user_id,
            },
          }),

          prisma.user.update({
            where: {
              id: user_id,
            },
            data: {
              trade_total: {
                increment: 1,
              },
            },
          }),
        ])
      );

      if (!createResult) throw ToastData.unknown;
    } else {
      const updateResult = await handleConnect((prisma) =>
        prisma.tether.update({
          where: {
            id: json.id,
            user_id,
          },
          data: {
            ...removeColumnsFromObject(json, [
              "user_id",
              "_count",
              "user",
              "id",
              "tether_proposals",
              "created_at",
              "updated_at",
            ]),
          },
        })
      );

      if (!updateResult) throw ToastData.unknown;

      const tether = await handleConnect((prisma) =>
        prisma.tether.findFirst({
          where: {
            id: json.id,
          },
          include: {
            user: {
              select: {
                trade_count: true,
                trade_rate: true,
                ...webPushUserSelect,
              },
            },
            tether_proposals: {
              where: {
                status: {
                  in: [
                    TetherProposalStatus.Open,
                    TetherProposalStatus.Complete,
                  ],
                },
              },
              include: {
                tether_rate: true,
                user: {
                  select: webPushUserSelect,
                },
              },
            },
          },
        })
      );

      if (!tether) throw ToastData.unknown;

      const tetherProposal = tether.tether_proposals.find(
        (tetherProposal) =>
          tetherProposal.status === TetherProposalStatus.Complete
      );
      if (tetherProposal) {
        const rate = decimalToNumber(
          tether.tether_proposals[0].tether_rate[0].rate
        );
        const trade_count = decimalToNumber(tether.user.trade_count);
        const trade_rate = decimalToNumber(tether.user.trade_rate);

        const updateResult = await handleConnect((prisma) =>
          prisma.user.update({
            where: {
              id: user_id,
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

        const ownerPayload = makeMessagePayload({
          body: `${tether?.user?.profile?.displayname}님, 거래완료!`,
          user: tether.user,
          type: AlarmTypes.P2PComplete,
          tether_id: tether.id,
        });

        const proposalPayload = makeMessagePayload({
          body: `${tetherProposal?.user?.profile?.displayname}님, 거래완료!`,
          user: tetherProposal.user,
          type: AlarmTypes.P2PComplete,
          tether_id: tether.id,
        });

        await sendWebpush(
          [ownerPayload, proposalPayload],
          [tether.user, tetherProposal.user]
        );
      }

      // 게시자가 취소
      if (json.status === TetherStatus.Cancel) {
        // 게시자가 제안자가 없을때 취소시
        const payload = makeMessagePayload({
          body: `${tether?.user?.profile?.displayname}님, 거래취소!`,
          user: tether.user,
          type: AlarmTypes.P2PCancel,
          tether_id: tether.id,
        });
        await sendWebpush([payload], [tether.user]);
      }
    }

    return {
      result: true,
      message: json.id === 0 ? ToastData.threadCreate : ToastData.threadUpdate,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
