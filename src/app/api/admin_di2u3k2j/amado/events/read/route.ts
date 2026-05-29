import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as amadoEventsData } from "@/app/api/admin_di2u3k2j/amado/events/read";
import { parseQueryParams } from "@/helpers/common";
import type { AmadoEventsReadProps } from "@/app/api/admin_di2u3k2j/amado/events/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: AmadoEventsReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await amadoEventsData(queryParams);
  return response.json(result);
};
