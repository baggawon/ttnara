import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as fixedUpdate } from "@/app/api/admin_di2u3k2j/chat/fixed-messages/update";
import type { ChatFixedMessageUpdateProps } from "@/app/api/admin_di2u3k2j/chat/fixed-messages/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const json: ChatFixedMessageUpdateProps = await req.json();
  const result = await fixedUpdate(json);
  return response.json(result);
};
