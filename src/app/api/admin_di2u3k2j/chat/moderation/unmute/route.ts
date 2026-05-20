import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as unmute } from "@/app/api/admin_di2u3k2j/chat/moderation/unmute";
import type { ChatModerationUnmuteProps } from "@/app/api/admin_di2u3k2j/chat/moderation/unmute";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatModerationUnmuteProps = await req.json();
  const result = await unmute(json);
  return response.json(result);
};
