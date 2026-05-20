import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as qnaDelete } from "@/app/api/admin_di2u3k2j/support/qna/delete";
import type { SupportQnaDeleteProps } from "@/app/api/admin_di2u3k2j/support/qna/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: SupportQnaDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await qnaDelete(json);
  return response.json(result);
};
