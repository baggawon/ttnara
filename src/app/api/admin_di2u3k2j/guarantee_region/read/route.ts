import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as guaranteeRegionData } from "@/app/api/admin_di2u3k2j/guarantee_region/read";
import { parseQueryParams } from "@/helpers/common";
import type { GuaranteeRegionReadProps } from "@/app/api/admin_di2u3k2j/guarantee_region/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: GuaranteeRegionReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await guaranteeRegionData(queryParams);
  return response.json(result);
};
