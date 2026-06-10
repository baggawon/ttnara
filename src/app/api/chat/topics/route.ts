import { ResponseValues } from "@/helpers/server/serverResponse";
import { handleConnect } from "@/helpers/server/prisma";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";

export interface ChatPublicConfig {
  chat_server_url: string;
  topics: Array<{
    id: number;
    name: string;
    display_order: number;
    is_active: boolean;
  }>;
  settings: {
    max_chat_length: number;
    max_display_items: number;
    spam_frequency_seconds: number;
    level_chat: number;
    level_moderator: number;
    rank_source: "trade" | "board" | "none";
  };
}

export const GET = async (_req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();

  const [topics, setting] = await Promise.all([
    handleConnect((prisma) =>
      prisma.chat_topic.findMany({
        where: { is_active: true },
        orderBy: [{ display_order: "asc" }, { id: "asc" }],
        select: { id: true, name: true, display_order: true, is_active: true },
      })
    ),
    handleConnect((prisma) =>
      prisma.chat_setting.findFirst({
        orderBy: { id: "asc" },
        select: {
          chat_server_url: true,
          max_chat_length: true,
          max_display_items: true,
          spam_frequency_seconds: true,
          level_chat: true,
          level_moderator: true,
          chat_rank_source: true,
        },
      })
    ),
  ]);

  const data: ChatPublicConfig = {
    chat_server_url: setting?.chat_server_url ?? "",
    topics: topics ?? [],
    settings: {
      max_chat_length: setting?.max_chat_length ?? 50,
      max_display_items: setting?.max_display_items ?? 100,
      spam_frequency_seconds: setting?.spam_frequency_seconds ?? 3,
      level_chat: setting?.level_chat ?? 1,
      level_moderator: setting?.level_moderator ?? 5,
      rank_source:
        (setting?.chat_rank_source as "trade" | "board" | "none") ?? "trade",
    },
  };

  return response.json({ result: true, data });
};
