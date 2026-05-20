import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as tetherSettingsRead } from "@/app/api/admin_di2u3k2j/settings/tether/read";
import { parseQueryParams } from "@/helpers/common";
import type { TetherSettingsReadProps } from "@/app/api/admin_di2u3k2j/settings/tether/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: TetherSettingsReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await tetherSettingsRead(queryParams);
  return response.json(result);
};
