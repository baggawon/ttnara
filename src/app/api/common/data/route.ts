import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as commonData } from "@/app/api/common/data";
import { parseQueryParams } from "@/helpers/common";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: any = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await commonData(queryParams);
  return response.json(result);
};
