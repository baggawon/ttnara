import {
  makeMessagePayload,
  RequestValidator,
  requestValidator,
  sendWebpush,
  webPushUserSelect,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect, PrismaOperationError } from "@/helpers/server/prisma";
import type { Prisma, tether_proposal } from "@prisma/client";
import { decimalToNumber } from "@/helpers/common";
import {
  AlarmTypes,
  TetherProposalStatus,
  TetherStatus,
} from "@/helpers/types";

export interface TetherProposalUpdateProps extends tether_proposal {}

const isCancelRequest = (json: TetherProposalUpdateProps) =>
  json.status === TetherProposalStatus.Cancel;

// The client posts whole rows it read back from the API (the cancel flow
// spreads the proposal it rendered, relations included). Never hand that
// object to prisma as-is: a relation array such as `tether_rate` is a valid
// column name but an invalid update input, and prisma rejects the entire
// query. Only the columns listed here are ever writable through this route.
const pickMessengerColumns = (json: TetherProposalUpdateProps) => ({
  ...(typeof json.telegram_id !== "undefined" && {
    telegram_id: json.telegram_id,
  }),
  ...(typeof json.kakao_id !== "undefined" && { kakao_id: json.kakao_id }),
  ...(typeof json.messenger_type === "string" && {
    messenger_type: json.messenger_type,
  }),
});

const proposalCreateData = (
  json: TetherProposalUpdateProps,
  user_id: string
): Prisma.tether_proposalUncheckedCreateWithoutTetherInput => ({
  ...pickMessengerColumns(json),
  price: json.price,
  qty: json.qty,
  ...(typeof json.currency === "string" && { currency: json.currency }),
  reason: null,
  user_id,
  status: TetherProposalStatus.Open,
});

const proposalUpdateData = (
  json: TetherProposalUpdateProps,
  { isCancel, isOwner }: { isCancel: boolean; isOwner: boolean }
): Prisma.tether_proposalUpdateWithoutTetherInput => ({
  ...pickMessengerColumns(json),
  ...(typeof json.status === "string" && { status: json.status }),
  // A cancel keeps the agreed price/qty on the record for history.
  ...(isCancel
    ? { reason: isOwner ? "owner" : "proposal" }
    : { price: json.price, qty: json.qty }),
});

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

    const tether = await handleConnect(
      (prisma) =>
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
        }),
      { rethrow: true, label: "tether.proposal.update:read" }
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

      const updateResult = await handleConnect(
        (prisma) =>
          prisma.$transaction(async (tx) => {
            const updated = await tx.tether.update({
              where: {
                id: json.tether_id,
              },
              data: {
                status: TetherStatus.Progress,
                tether_proposals: {
                  create: proposalCreateData(json, user_id),
                },
              },
            });

            await tx.user.update({
              where: { id: user_id },
              data: { trade_joined: { increment: 1 } },
            });

            return updated;
          }),
        { rethrow: true, label: "tether.proposal.create:write" }
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

      const isCancel = isCancelRequest(json);

      const updateResult = await handleConnect(
        (prisma) =>
          prisma.$transaction(async (tx) => {
            const updated = await tx.tether.update({
              where: {
                id: json.tether_id,
              },
              data: {
                ...(isCancel && {
                  status: TetherStatus.Open,
                }),
                tether_proposals: {
                  update: {
                    where: {
                      id: json.id,
                    },
                    data: proposalUpdateData(json, { isCancel, isOwner }),
                  },
                },
              },
            });

            if (isCancel) {
              const cancelledProposal = tether.tether_proposals.find(
                (p) => p.id === json.id
              );
              if (cancelledProposal) {
                await tx.user.update({
                  where: { id: cancelledProposal.user_id },
                  data: { trade_joined: { decrement: 1 } },
                });
              }
            }

            return updated;
          }),
        { rethrow: true, label: "tether.proposal.update:write" }
      );

      if (!updateResult) throw ToastData.unknown;

      if (isCancel) {
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
      message = isCancelRequest(json)
        ? ToastData.threadProposalCancel
        : ToastData.threadProposalUpdate;
    }

    return {
      result: true,
      message,
    };
  } catch (error) {
    // A rejected query has already been logged with its call-site label; the
    // client only ever sees the generic toast so no internals leak out.
    if (error instanceof PrismaOperationError) {
      return {
        result: false,
        message: ToastData.unknown,
      };
    }
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
