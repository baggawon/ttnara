import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as unban } from "@/app/api/admin_di2u3k2j/chat/moderation/unban";
import type { ChatModerationUnbanProps } from "@/app/api/admin_di2u3k2j/chat/moderation/unban";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatModerationUnbanProps = await req.json();
  const result = await unban(json);
  return response.json(result);
};
