import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as qnaCategoriesRead } from "@/app/api/admin_di2u3k2j/support/qna-categories/read";
import { parseQueryParams } from "@/helpers/common";
import type { SupportQnaCategoriesReadProps } from "@/app/api/admin_di2u3k2j/support/qna-categories/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: SupportQnaCategoriesReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await qnaCategoriesRead(queryParams);
  return response.json(result);
};
