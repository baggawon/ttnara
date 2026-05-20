import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as qnaRead } from "@/app/api/admin_di2u3k2j/support/qna/read";
import { parseQueryParams } from "@/helpers/common";
import type { SupportQnaReadProps } from "@/app/api/admin_di2u3k2j/support/qna/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: SupportQnaReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await qnaRead(queryParams);
  return response.json(result);
};
