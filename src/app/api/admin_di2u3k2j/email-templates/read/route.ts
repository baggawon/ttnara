import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as readData } from "@/app/api/admin_di2u3k2j/email-templates/read";
import { parseQueryParams } from "@/helpers/common";
import type { EmailTemplatesReadProps } from "@/app/api/admin_di2u3k2j/email-templates/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: EmailTemplatesReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await readData(queryParams);
  return response.json(result);
};
