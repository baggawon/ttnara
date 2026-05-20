import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { parseQueryParams } from "@/helpers/common";
import { GET as mediaListGET } from "@/app/api/uploads/media/list";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams = parseQueryParams<{
    attached_to_type?: string;
    attached_to_id?: string | number;
  }>(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await mediaListGET(queryParams);
  return response.json(result);
};
