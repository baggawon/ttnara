import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as threadSettinsGeneralData } from "@/app/api/admin_di2u3k2j/settings/thread/read";
import { parseQueryParams } from "@/helpers/common";
import type { ThreadGenaralSettingsReadProps } from "@/app/api/admin_di2u3k2j/settings/thread/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: ThreadGenaralSettingsReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await threadSettinsGeneralData(queryParams);
  return response.json(result);
};
