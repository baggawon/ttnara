import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as levelData } from "@/app/api/admin_di2u3k2j/settings/level/read";
import { parseQueryParams } from "@/helpers/common";
import type { LevelReadProps } from "@/app/api/admin_di2u3k2j/settings/level/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: LevelReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await levelData(queryParams);
  return response.json(result);
};
