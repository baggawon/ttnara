import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as topicsUpdate } from "@/app/api/admin_di2u3k2j/chat/topics/update";
import type { ChatTopicUpdateProps } from "@/app/api/admin_di2u3k2j/chat/topics/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatTopicUpdateProps = await req.json();
  const result = await topicsUpdate(json);
  return response.json(result);
};
