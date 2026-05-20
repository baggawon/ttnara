import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as noticesDelete } from "@/app/api/admin_di2u3k2j/chat/notices/delete";
import type { ChatNoticeDeleteProps } from "@/app/api/admin_di2u3k2j/chat/notices/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatNoticeDeleteProps = await req.json();
  const result = await noticesDelete(json);
  return response.json(result);
};
