import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as hide } from "@/app/api/admin_di2u3k2j/chat/moderation/hide";
import type { ChatModerationHideProps } from "@/app/api/admin_di2u3k2j/chat/moderation/hide";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatModerationHideProps = await req.json();
  const result = await hide(json);
  return response.json(result);
};
