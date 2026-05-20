import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as templateReadData } from "@/app/api/admin_di2u3k2j/push-notification/template/read";
import { parseQueryParams } from "@/helpers/common";
import type { PushTemplateReadProps } from "@/app/api/admin_di2u3k2j/push-notification/template/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: PushTemplateReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await templateReadData(queryParams);
  return response.json(result);
};
