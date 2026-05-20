import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import {
  POST as resetTradeRecordsPOST,
  type ResetTradeRecordsProps,
} from "@/app/api/admin_di2u3k2j/system/reset-trade-records";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: ResetTradeRecordsProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await resetTradeRecordsPOST(json);
  return response.json(result);
};
