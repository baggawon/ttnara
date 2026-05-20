import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as pointHistoryData } from "@/app/api/point/history";
import type { PointHistoryReadProps } from "@/app/api/point/history";
import { parseQueryParams } from "@/helpers/common";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: PointHistoryReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await pointHistoryData(queryParams);
  return response.json(result);
};
