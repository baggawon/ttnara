import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { generalUpdateProps } from "@/app/api/admin_di2u3k2j/settings/general/update";
import { POST as generalUpdatePOST } from "@/app/api/admin_di2u3k2j/settings/general/update";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: generalUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await generalUpdatePOST(json);
  return response.json(result);
};

export const GET = async (_req: NextRequest): Promise<NextResponse> => {
  if (!appCache.getByKey(CacheKey.GeneralSettings)) {
    await appCache.initializeFromDB();
  } else {
    appCache.refreshCache(CacheKey.GeneralSettings);
  }
  const response = ResponseValues<ApiReturnProps>();
  const nextResponse = response.json({ result: true });
  return nextResponse;
};
