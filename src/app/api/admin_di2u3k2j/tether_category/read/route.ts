import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as tetherCategoryData } from "@/app/api/admin_di2u3k2j/tether_category/read";
import { parseQueryParams } from "@/helpers/common";
import type { TetherCategoryReadProps } from "@/app/api/admin_di2u3k2j/tether_category/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: TetherCategoryReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await tetherCategoryData(queryParams);
  return response.json(result);
};
