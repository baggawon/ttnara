import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { parseQueryParams } from "@/helpers/common";
import {
  GET as navList,
  type NavMenuPublicReadProps,
} from "@/app/api/nav/list";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: NavMenuPublicReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await navList(queryParams);
  return response.json(result);
};
