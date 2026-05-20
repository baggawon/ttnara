import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as qnaCategoriesDelete } from "@/app/api/admin_di2u3k2j/support/qna-categories/delete";
import type { SupportQnaCategoriesDeleteProps } from "@/app/api/admin_di2u3k2j/support/qna-categories/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: SupportQnaCategoriesDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await qnaCategoriesDelete(json);
  return response.json(result);
};
