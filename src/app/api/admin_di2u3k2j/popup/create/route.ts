import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as popupCreateData } from "@/app/api/admin_di2u3k2j/popup/create";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const formData: FormData = await req.formData();
  const response = ResponseValues<ApiReturnProps>();
  const result = await popupCreateData(formData);
  return response.json(result);
};
