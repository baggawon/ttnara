import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as featuredPostRead } from "@/app/api/admin_di2u3k2j/featured/post/read";
import { parseQueryParams } from "@/helpers/common";
import type { FeaturedPostReadProps } from "@/app/api/admin_di2u3k2j/featured/post/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: FeaturedPostReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await featuredPostRead(queryParams);
  return response.json(result);
};
