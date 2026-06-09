import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { parseQueryParams } from "@/helpers/common";
import { GET as profileSummaryGET } from "@/app/api/profile/summary";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await profileSummaryGET(queryParams);
  return response.json(result);
};
