import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as partnersData } from "@/app/api/admin_di2u3k2j/partners/read";
import { parseQueryParams } from "@/helpers/common";
import type { PartnersReadProps } from "@/app/api/admin_di2u3k2j/partners/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: PartnersReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await partnersData(queryParams);
  return response.json(result);
};
