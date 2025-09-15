import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { messageUpdateProps } from "@/app/api/message/update";
import { POST as messageUpdatePOST } from "@/app/api/message/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: messageUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await messageUpdatePOST(json);
  return response.json(result);
};
