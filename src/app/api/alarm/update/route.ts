import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { alarmUpdateProps } from "@/app/api/alarm/update";
import { POST as alarmUpdatePOST } from "@/app/api/alarm/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: alarmUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await alarmUpdatePOST(json);
  return response.json(result);
};
