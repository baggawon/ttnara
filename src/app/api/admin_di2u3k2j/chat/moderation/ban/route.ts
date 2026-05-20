import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as ban } from "@/app/api/admin_di2u3k2j/chat/moderation/ban";
import type { ChatModerationBanProps } from "@/app/api/admin_di2u3k2j/chat/moderation/ban";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatModerationBanProps = await req.json();
  const result = await ban(json);
  return response.json(result);
};
