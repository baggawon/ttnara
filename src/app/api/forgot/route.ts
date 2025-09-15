import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { ForgotProps } from "@/app/api/forgot";
import { POST as forgotPOST } from "@/app/api/forgot";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: ForgotProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await forgotPOST(json);
  return response.json(result);
};
