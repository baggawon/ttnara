import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as rankSummaryData } from "@/app/api/rank/summary";
import { parseQueryParams } from "@/helpers/common";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await rankSummaryData(queryParams);
  return response.json(result);
};
