import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as guaranteeCreatePOST } from "@/app/api/admin_di2u3k2j/guarantee/create";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const formData: FormData = await req.formData();
  const response = ResponseValues<ApiReturnProps>();

  const result = await guaranteeCreatePOST(formData);
  return response.json(result);
};
