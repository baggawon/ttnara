import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as qnaCreate } from "@/app/api/admin_di2u3k2j/support/qna/create";
import type { SupportQnaCreateProps } from "@/app/api/admin_di2u3k2j/support/qna/create";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: SupportQnaCreateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await qnaCreate(json);
  return response.json(result);
};
