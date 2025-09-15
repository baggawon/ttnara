import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as threadUpdatePOST } from "@/app/api/threads/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const formData = await req.formData();
  const response = ResponseValues<ApiReturnProps>();

  const result = await threadUpdatePOST(formData);
  return response.json(result);
};
