import {
  makeMessagePayload,
  RequestValidator,
  requestValidator,
  sendWebpush,
  webPushUserSelect,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import type { tether, tether_proposal } from "@prisma/client";
import { removeColumnsFromObject } from "@/helpers/basic";
import type { SimpleProfile } from "@/app/api/threads/read";
import { AlarmTypes, TetherStatus } from "@/helpers/types";
import { attachMediaToContent } from "@/helpers/server/mediaAttach";
import { stripCloudFrontSignatures } from "@/helpers/server/s3";

export interface TetherUpdateProps extends tether {
  user: SimpleProfile | null;
  tether_proposals: TetherProposals[];
  region_category_ids: number[];
}

export interface TetherProposals extends tether_proposal {
  user: SimpleProfile | null;
}

const STRIP_KEYS = [
  "user_id",
  "_count",
  "user",
  "id",
  "tether_proposals",
  "region_selections",
  "region_category_ids",
  "created_at",
  "updated_at",
] as const;

const normalizeContact = (json: TetherUpdateProps) => {
  if (json.hide_contact) {
    json.contact_method = null;
    json.contact_id = null;
    json.preferred_time = null;
  }
};

export const POST = async (json: TetherUpdateProps) => {
  try {
    if (typeof json?.id !== "number") throw ToastData.unknown;

    const { uid } = await requestValidator([RequestValidator.User], json);
    const user_id = uid!;

    const regionCategoryIds = Array.isArray(json.region_category_ids)
      ? Array.from(
          new Set(
            json.region_category_ids.filter(
              (v) => typeof v === "number" && v > 0
            )
          )
        )
      : [];

    normalizeContact(json);

    // Strip CloudFront signatures — condition is signed on read, so editor
    // round-trips must not persist an expiring signature.
    if (json.condition) {
      json.condition = stripCloudFrontSignatures(json.condition);
    }

    if (json.id === 0) {
      const generalSetting = appCache.getByKey(CacheKey.GeneralSettings) as
        | { p2p_paused?: boolean }
        | null
        | undefined;
      if (generalSetting?.p2p_paused) throw ToastData.tetherPaused;

      const createResult = await handleConnect((prisma) =>
        prisma.$transaction(async (tx) => {
          const created = await tx.tether.create({
            data: {
              ...removeColumnsFromObject(json, [...STRIP_KEYS]),
              user_id,
              region_selections: {
                create: regionCategoryIds.map((category_id) => ({
                  category_id,
                })),
              },
            },
          });

          await tx.user.update({
            where: { id: user_id },
            data: { trade_total: { increment: 1 } },
          });

          return created;
        })
      );

      if (!createResult) throw ToastData.unknown;

      if (json.condition) {
        await attachMediaToContent({
          authorId: user_id,
          content: json.condition,
          attachedToType: "tether",
          attachedToId: createResult.id,
          isEdit: false,
        });
      }
    } else {
      // Completion (tether.status → Complete) is now driven exclusively by
      // /api/tethers/proposal/rate/update when both parties have rated.
      // Disallow clients from setting Complete here.
      if (json.status === TetherStatus.Complete) throw ToastData.unknown;

      const updateResult = await handleConnect((prisma) =>
        prisma.$transaction(async (tx) => {
          const existing = await tx.tether.findFirst({
            where: { id: json.id, user_id },
            select: { id: true },
          });
          if (!existing) return null;

          const updated = await tx.tether.update({
            where: { id: json.id },
            data: {
              ...removeColumnsFromObject(json, [...STRIP_KEYS]),
            },
          });

          await tx.tether_region_selection.deleteMany({
            where: { tether_id: json.id },
          });
          if (regionCategoryIds.length > 0) {
            await tx.tether_region_selection.createMany({
              data: regionCategoryIds.map((category_id) => ({
                tether_id: json.id,
                category_id,
              })),
              skipDuplicates: true,
            });
          }

          return updated;
        })
      );

      if (!updateResult) throw ToastData.unknown;

      if (json.condition) {
        await attachMediaToContent({
          authorId: user_id,
          content: json.condition,
          attachedToType: "tether",
          attachedToId: json.id,
          isEdit: true,
        });
      }

      if (json.status === TetherStatus.Cancel) {
        const tether = await handleConnect((prisma) =>
          prisma.tether.findFirst({
            where: { id: json.id },
            include: {
              user: { select: webPushUserSelect },
            },
          })
        );
        if (tether) {
          const payload = makeMessagePayload({
            body: `${tether.user?.profile?.displayname}님, 거래취소!`,
            user: tether.user,
            type: AlarmTypes.P2PCancel,
            tether_id: tether.id,
          });
          await sendWebpush([payload], [tether.user]);
        }
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
