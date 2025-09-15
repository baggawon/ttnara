import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as userData } from "@/app/api/admin_di2u3k2j/settings/user/read";
import { parseQueryParams } from "@/helpers/common";
import type { UserReadProps } from "@/app/api/admin_di2u3k2j/settings/user/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: UserReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await userData(queryParams);
  return response.json(result);
};
