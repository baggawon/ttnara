import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as messageData } from "@/app/api/message/read";
import { parseQueryParams } from "@/helpers/common";
import type { MessageReadProps } from "@/app/api/message/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: MessageReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await messageData(queryParams);
  return response.json(result);
};
