import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as guaranteeData } from "@/app/api/admin_di2u3k2j/guarantee/read";
import { parseQueryParams } from "@/helpers/common";
import type { GuaranteeReadProps } from "@/app/api/admin_di2u3k2j/guarantee/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: GuaranteeReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await guaranteeData(queryParams);
  return response.json(result);
};
