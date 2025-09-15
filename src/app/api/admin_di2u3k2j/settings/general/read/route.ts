import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as generalData } from "@/app/api/admin_di2u3k2j/settings/general/read";
import { parseQueryParams } from "@/helpers/common";
import type { GeneralReadProps } from "@/app/api/admin_di2u3k2j/settings/general/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: GeneralReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await generalData(queryParams);
  return response.json(result);
};
