import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as usersData } from "@/app/api/admin_di2u3k2j/users/read";
import { parseQueryParams } from "@/helpers/common";
import type { UsersReadProps } from "@/app/api/admin_di2u3k2j/users/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: UsersReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await usersData(queryParams);
  return response.json(result);
};
