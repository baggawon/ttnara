import { parseQueryParams } from "@/helpers/common";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { type NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: any = parseQueryParams(req);
  if (queryParams.method === CacheKey.Tether)
    appCache.refreshCache(CacheKey.Tether);

  return NextResponse.json({ result: true });
};
