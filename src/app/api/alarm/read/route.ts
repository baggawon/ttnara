import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as alarmData } from "@/app/api/alarm/read";
import { parseQueryParams } from "@/helpers/common";
import type { AlarmReadProps } from "@/app/api/alarm/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: AlarmReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await alarmData(queryParams);
  return response.json(result);
};
