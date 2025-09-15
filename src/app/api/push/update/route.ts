import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { PushUpdateProps } from "@/app/api/push/update";
import { POST as pushUpdatePOST } from "@/app/api/push/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: PushUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await pushUpdatePOST(json);
  return response.json(result);
};
