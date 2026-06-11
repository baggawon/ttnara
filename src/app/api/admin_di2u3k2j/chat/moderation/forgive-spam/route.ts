import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as forgiveSpam } from "@/app/api/admin_di2u3k2j/chat/moderation/forgive-spam";
import type { ChatModerationForgiveSpamProps } from "@/app/api/admin_di2u3k2j/chat/moderation/forgive-spam";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatModerationForgiveSpamProps = await req.json();
  const result = await forgiveSpam(json);
  return response.json(result);
};
