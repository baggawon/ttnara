import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as topicsData } from "@/app/api/admin_di2u3k2j/topics/read";
import { parseQueryParams } from "@/helpers/common";
import type { TopicsReadProps } from "@/app/api/admin_di2u3k2j/topics/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: TopicsReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await topicsData(queryParams);
  return response.json(result);
};
