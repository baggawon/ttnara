import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as historyReadData } from "@/app/api/admin_di2u3k2j/push-notification/history/read";
import { parseQueryParams } from "@/helpers/common";
import type { PushHistoryReadProps } from "@/app/api/admin_di2u3k2j/push-notification/history/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: PushHistoryReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await historyReadData(queryParams);
  return response.json(result);
};
