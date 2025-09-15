import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { messageDeleteProps } from "@/app/api/message/delete";
import { POST as messageDeletePOST } from "@/app/api/message/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: messageDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await messageDeletePOST(json);
  return response.json(result);
};
