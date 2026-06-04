import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as listGET } from "@/app/api/admin_di2u3k2j/board_rank_badges/list";
import { parseQueryParams } from "@/helpers/common";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await listGET(queryParams);
  return response.json(result);
};
