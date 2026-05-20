import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as qnaCategoriesCreate } from "@/app/api/admin_di2u3k2j/support/qna-categories/create";
import type { SupportQnaCategoryCreateProps } from "@/app/api/admin_di2u3k2j/support/qna-categories/create";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: SupportQnaCategoryCreateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await qnaCategoriesCreate(json);
  return response.json(result);
};
