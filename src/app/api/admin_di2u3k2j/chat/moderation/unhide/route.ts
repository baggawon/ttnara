import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as unhide } from "@/app/api/admin_di2u3k2j/chat/moderation/unhide";
import type { ChatModerationUnhideProps } from "@/app/api/admin_di2u3k2j/chat/moderation/unhide";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatModerationUnhideProps = await req.json();
  const result = await unhide(json);
  return response.json(result);
};
