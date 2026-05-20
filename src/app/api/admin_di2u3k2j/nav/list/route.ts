import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { parseQueryParams } from "@/helpers/common";
import { GET as adminNavList } from "@/app/api/admin_di2u3k2j/nav/list";
import type { NavMenuListProps } from "@/app/api/admin_di2u3k2j/nav/list";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: NavMenuListProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await adminNavList(queryParams);
  return response.json(result);
};
