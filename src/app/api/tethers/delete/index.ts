import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { tetherInclude, tetherPrivateSelect } from "@/app/api/tethers/read";
import { TetherProposalStatus, TetherStatus } from "@/helpers/types";

export interface tethersDeleteProps {
  deleteTetherId: number;
}

export const POST = async (json: tethersDeleteProps) => {
  try {
    if (typeof json?.deleteTetherId !== "number") throw ToastData.unknown;

    const { uid } = await requestValidator([RequestValidator.User], json);

    const getResult = await handleConnect((prisma) =>
      prisma.tether.findFirst({
        where: {
          id: json.deleteTetherId,
          user_id: uid!,
        },
        select: {
          ...tetherPrivateSelect,
          ...tetherInclude({
            status: {
              in: [TetherProposalStatus.Open, TetherProposalStatus.Complete],
            },
          }),
        },
      })
    );

    if (!getResult) throw ToastData.unknown;

    if (
      getResult.tether_proposals.some(
        (proposal) => proposal.status === TetherProposalStatus.Open
      )
    )
      throw ToastData.unknown;

    const transactionResult = await handleConnect((prisma) =>
      prisma.$transaction([
        prisma.tether.update({
          where: {
            id: json.deleteTetherId,
            user_id: uid!,
          },
          data: {
            status: TetherStatus.Cancel,
          },
        }),
        prisma.user.update({
          where: {
            id: uid,
          },
          data: {
            trade_total: {
              decrement: 1,
            },
          },
        }),
      ])
    );
    if (!transactionResult) throw ToastData.unknown;

    return {
      result: true,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
