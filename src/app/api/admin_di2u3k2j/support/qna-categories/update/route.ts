import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as qnaCategoriesUpdate } from "@/app/api/admin_di2u3k2j/support/qna-categories/update";
import type { SupportQnaCategoryUpdateProps } from "@/app/api/admin_di2u3k2j/support/qna-categories/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: SupportQnaCategoryUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await qnaCategoriesUpdate(json);
  return response.json(result);
};
