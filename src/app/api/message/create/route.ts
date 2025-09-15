import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { MessageCreatePostProps } from "@/app/api/message/create";
import { POST as messageCreatePOST } from "@/app/api/message/create";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: MessageCreatePostProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await messageCreatePOST(json);
  return response.json(result);
};
