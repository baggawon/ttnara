import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as threadReadGET } from "./index";
import { parseQueryParams } from "@/helpers/common";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await threadReadGET(queryParams);
  return response.json(result);
};
