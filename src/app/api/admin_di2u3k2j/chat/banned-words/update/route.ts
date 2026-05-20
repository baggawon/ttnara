import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as bannedWordsUpdate } from "@/app/api/admin_di2u3k2j/chat/banned-words/update";
import type { ChatBannedWordUpdateProps } from "@/app/api/admin_di2u3k2j/chat/banned-words/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatBannedWordUpdateProps = await req.json();
  const result = await bannedWordsUpdate(json);
  return response.json(result);
};
