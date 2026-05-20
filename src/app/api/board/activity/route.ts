import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as boardActivityData } from "@/app/api/board/activity";
import type { BoardActivityReadProps } from "@/app/api/board/activity";
import { parseQueryParams } from "@/helpers/common";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: BoardActivityReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await boardActivityData(queryParams);
  return response.json(result);
};
