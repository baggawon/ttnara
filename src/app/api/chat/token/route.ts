import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import { getServerSession } from "next-auth";
import type { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { handleConnect } from "@/helpers/server/prisma";
import { signChatToken } from "@/helpers/server/chatToken";
import {
  appCache,
  CacheKey,
  rankSystemHasActiveTiers,
} from "@/helpers/server/serverCache";
import { ToastData } from "@/helpers/toastData";

export interface ChatTokenResponse {
  token: string;
  expiresAt: number;
}

export const POST = async (_req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();

  const session = await getServerSession(authOptions);
  if (!session?.user?.name) {
    return response.json({ result: false, message: ToastData.noAuth });
  }

  const user = await handleConnect((prisma) =>
    prisma.user.findUnique({
      where: { username: session.user!.name! },
      select: {
        id: true,
        is_active: true,
        profile: {
          select: {
            displayname: true,
            auth_level: true,
            is_app_admin: true,
            current_rank_level: true,
            current_rank_image: true,
            current_board_rank_level: true,
            current_board_rank_image: true,
          },
        },
      },
    })
  );

  if (!user || !user.is_active || !user.profile) {
    return response.json({ result: false, message: ToastData.noAuth });
  }

  // Read the chat singleton once: the banned-user check and the admin-chosen
  // rank source (거래 등급 / 게시판 등급 / 표시 안 함) both live on it.
  const setting = await handleConnect((prisma) =>
    prisma.chat_setting.findFirst({
      orderBy: { id: "asc" },
      select: {
        chat_rank_source: true,
        level_moderator: true,
        banned_users: { where: { id: user.id }, select: { id: true } },
      },
    })
  );

  // Refuse to mint a token for a banned user — saves the chat_server an
  // immediate WS rejection round-trip.
  if (setting?.banned_users.length) {
    return response.json({
      result: false,
      message: "채팅 이용이 제한되었습니다.",
    });
  }

  // Pick which rank system the badge beside the name reflects. "none" sends a
  // null image so the client renders no badge.
  const rankSource = setting?.chat_rank_source ?? "none";
  // Safety net: if the chosen source's rank system has no active tiers (e.g.
  // p2p disabled → 0 trade ranks), never serve a stale per-user snapshot.
  const sourceEmpty =
    (rankSource === "trade" && rankSystemHasActiveTiers("trade") === false) ||
    (rankSource === "board" && rankSystemHasActiveTiers("board") === false);
  const rank_level =
    rankSource === "board"
      ? (user.profile.current_board_rank_level ?? 1)
      : (user.profile.current_rank_level ?? 1);
  const baseImage =
    rankSource === "none" || sourceEmpty
      ? null
      : rankSource === "board"
        ? (user.profile.current_board_rank_image ?? null)
        : (user.profile.current_rank_image ?? null);
  // Admin/moderator authors show the dedicated admin badge (shared with the
  // forum, stored unsigned in thread_setting) instead of their rank badge —
  // mirrors the forum's BoardRankIcon. Independent of the rank source. The
  // chat_server signs it on broadcast just like any rank image.
  const threadSettings = appCache.getByKey(CacheKey.ThreadGeneralSettings) as
    | { admin_badge_image_url?: string | null }
    | undefined;
  const levelModerator = setting?.level_moderator ?? Number.MAX_SAFE_INTEGER;
  const isAdmin =
    !!user.profile.is_app_admin ||
    (user.profile.auth_level ?? 0) >= levelModerator;
  const rank_image = isAdmin
    ? (threadSettings?.admin_badge_image_url ?? null)
    : baseImage;

  try {
    const { token, expiresAt } = signChatToken({
      sub: user.id,
      displayname: user.profile.displayname,
      rank_level,
      // Stored unsigned on purpose: the chat server persists this into
      // chat_message.rank_image and CloudFront-signs it fresh on every
      // broadcast / history send (a signature would expire if persisted).
      rank_image,
      auth_level: user.profile.auth_level,
    });
    return response.json({
      result: true,
      data: { token, expiresAt } satisfies ChatTokenResponse,
    });
  } catch (err) {
    console.error("[chat/token] sign failed", err);
    return response.json({ result: false, message: ToastData.unknown });
  }
};
