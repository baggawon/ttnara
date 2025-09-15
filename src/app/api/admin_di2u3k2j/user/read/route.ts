import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as userData } from "@/app/api/admin_di2u3k2j/user/read";
import { parseQueryParams } from "@/helpers/common";
import type { UserForAdmin } from "@/app/api/admin_di2u3k2j/user/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: UserForAdmin = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await userData(queryParams);
  return response.json(result);
};
