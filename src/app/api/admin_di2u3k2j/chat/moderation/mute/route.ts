import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as mute } from "@/app/api/admin_di2u3k2j/chat/moderation/mute";
import type { ChatModerationMuteProps } from "@/app/api/admin_di2u3k2j/chat/moderation/mute";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatModerationMuteProps = await req.json();
  const result = await mute(json);
  return response.json(result);
};
