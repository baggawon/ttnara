import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as noticesUpdate } from "@/app/api/admin_di2u3k2j/chat/notices/update";
import type { ChatNoticeUpdateProps } from "@/app/api/admin_di2u3k2j/chat/notices/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatNoticeUpdateProps = await req.json();
  const result = await noticesUpdate(json);
  return response.json(result);
};
