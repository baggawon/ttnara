import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as purge } from "@/app/api/admin_di2u3k2j/chat/history/purge";
import type { ChatHistoryPurgeProps } from "@/app/api/admin_di2u3k2j/chat/history/purge";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatHistoryPurgeProps = await req.json();
  const result = await purge(json);
  return response.json(result);
};
