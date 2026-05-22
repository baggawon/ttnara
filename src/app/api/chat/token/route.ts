import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import { getServerSession } from "next-auth";
import type { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]";
import { handleConnect } from "@/helpers/server/prisma";
import { signChatToken } from "@/helpers/server/chatToken";
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
            current_rank_level: true,
            current_rank_image: true,
          },
        },
      },
    })
  );

  if (!user || !user.is_active || !user.profile) {
    return response.json({ result: false, message: ToastData.noAuth });
  }

  // Refuse to mint a token for a banned user — saves the chat_server an
  // immediate WS rejection round-trip.
  const banned = await handleConnect((prisma) =>
    prisma.chat_setting.findFirst({
      select: { id: true },
      where: { banned_users: { some: { id: user.id } } },
    })
  );
  if (banned) {
    return response.json({
      result: false,
      message: "채팅 이용이 제한되었습니다.",
    });
  }

  try {
    const { token, expiresAt } = signChatToken({
      sub: user.id,
      displayname: user.profile.displayname,
      rank_level: user.profile.current_rank_level ?? 1,
      // Stored unsigned on purpose: the chat server persists this into
      // chat_message.rank_image and CloudFront-signs it fresh on every
      // broadcast / history send (a signature would expire if persisted).
      rank_image: user.profile.current_rank_image ?? null,
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
