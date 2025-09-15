import {
  makeMessagePayload,
  RequestValidator,
  requestValidator,
  sendWebpush,
  webPushUserSelect,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { tether_proposal } from "@prisma/client";
import { removeColumnsFromObject } from "@/helpers/basic";
import { decimalToNumber } from "@/helpers/common";
import {
  AlarmTypes,
  TetherProposalStatus,
  TetherStatus,
} from "@/helpers/types";

export interface TetherProposalUpdateProps extends tether_proposal {}

export const POST = async (json: TetherProposalUpdateProps) => {
  try {
    if (
      typeof json?.id !== "number" ||
      typeof json?.price !== "number" ||
      (typeof json?.telegram_id === "string" && json?.telegram_id === "") ||
      (typeof json?.kakao_id === "string" && json?.kakao_id === "")
    )
      throw ToastData.unknown;

    const { uid, session } = await requestValidator(
      [RequestValidator.User],
      json
    );
    const user_id = uid!;

    const tether = await handleConnect((prisma) =>
      prisma.tether.findFirst({
        where: {
          id: json.tether_id,
        },
        include: {
          tether_proposals: {
            include: {
              user: {
                select: webPushUserSelect,
              },
            },
          },
          user: {
            select: webPushUserSelect,
          },
        },
      })
    );

    if (!tether) throw ToastData.unknown;

    if (json.id === 0) {
      if (
        decimalToNumber(tether.min_qty) > decimalToNumber(json.qty) ||
        decimalToNumber(tether.max_qty) < decimalToNumber(json.qty)
      ) {
        throw ToastData.unknown;
      }

      const existProposal = tether.status === TetherStatus.Progress;

      if (existProposal) throw ToastData.existProposal;

      const updateResult = await handleConnect((prisma) =>
        prisma.tether.update({
          where: {
            id: json.tether_id,
          },
          data: {
            status: TetherStatus.Progress,
            tether_proposals: {
              create: {
                ...removeColumnsFromObject(json, [
                  "id",
                  "reason",
                  "tether_id",
                  "user_id",
                  "status",
                  "user",
                  "created_at",
                  "updated_at",
                ]),
                reason: null,
                user_id,
                status: TetherProposalStatus.Open,
              },
            },
          },
        })
      );

      if (!updateResult) throw ToastData.unknown;

      const payload = makeMessagePayload({
        body: `${session?.user?.displayname}님, 거래요청!`,
        user: tether.user,
        type: AlarmTypes.P2PProgress,
        tether_id: tether.id,
      });

      await sendWebpush([payload], [tether.user]);
    } else {
      const isOwner = tether.user_id === user_id;
      const isProposalOwner = tether.tether_proposals.find(
        (proposal) =>
          proposal.id === json.id &&
          proposal.user_id === user_id &&
          proposal.status === TetherProposalStatus.Open
      );

      if (!isOwner && !isProposalOwner) throw ToastData.noAuth;

      const updateResult = await handleConnect((prisma) =>
        prisma.tether.update({
          where: {
            id: json.tether_id,
          },
          data: {
            ...(json.status === TetherProposalStatus.Cancel && {
              status: TetherStatus.Open,
            }),
            tether_proposals: {
              update: {
                where: {
                  id: json.id,
                },
                data: {
                  ...removeColumnsFromObject(json, [
                    "id",
                    "reason",
                    "tether_id",
                    "user_id",
                    "currency",
                    ...(json.status === TetherProposalStatus.Cancel
                      ? ["price", "qty"]
                      : []),
                    "user",
                    "created_at",
                    "updated_at",
                  ]),
                  ...(json.status === TetherProposalStatus.Cancel && {
                    reason: isOwner ? "owner" : "proposal",
                  }),
                },
              },
            },
          },
        })
      );

      if (!updateResult) throw ToastData.unknown;

      if (json.status === TetherProposalStatus.Cancel) {
        if (isOwner) {
          // 게시자가 일방적 취소시
          const tetherProposal = tether.tether_proposals.find(
            (tetherProposal) =>
              tetherProposal.status === TetherProposalStatus.Open
          );
          if (tetherProposal) {
            const ownerPayload = makeMessagePayload({
              body: `${tether?.user?.profile?.displayname}님, ${tether?.user?.profile?.displayname} 게시자 거래취소!`,
              type: AlarmTypes.P2POwnerCancel,
              user: tether.user,
              tether_id: tether.id,
            });

            const proposalPayload = makeMessagePayload({
              body: `${tetherProposal?.user?.profile?.displayname}님, ${tether?.user?.profile?.displayname} 게시자 거래취소!`,
              type: AlarmTypes.P2POwnerCancel,
              user: tetherProposal.user,
              tether_id: tether.id,
            });

            await sendWebpush(
              [ownerPayload, proposalPayload],
              [tether.user, tetherProposal.user]
            );
          }
        } else if (isProposalOwner) {
          const ownerPayload = makeMessagePayload({
            body: `${tether?.user?.profile?.displayname}님, 제안자 거래취소!`,
            user: tether.user,
            type: AlarmTypes.P2PProposalCancel,
            tether_id: tether.id,
          });

          const proposalPayload = makeMessagePayload({
            body: `${isProposalOwner.user?.profile?.displayname}님, 제안자 거래취소!`,
            user: isProposalOwner.user,
            type: AlarmTypes.P2PProposalCancel,
            tether_id: tether.id,
          });

          await sendWebpush(
            [ownerPayload, proposalPayload],
            [tether.user, isProposalOwner.user]
          );
        }
      }
    }

    let message = ToastData.threadProposalCreate;
    if (json.id !== 0) {
      message =
        json.status === TetherProposalStatus.Cancel
          ? ToastData.threadProposalCancel
          : ToastData.threadProposalUpdate;
    }

    return {
      result: true,
      message,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
