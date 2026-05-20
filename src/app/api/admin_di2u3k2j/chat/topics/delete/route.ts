import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as topicsDelete } from "@/app/api/admin_di2u3k2j/chat/topics/delete";
import type { ChatTopicDeleteProps } from "@/app/api/admin_di2u3k2j/chat/topics/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatTopicDeleteProps = await req.json();
  const result = await topicsDelete(json);
  return response.json(result);
};
