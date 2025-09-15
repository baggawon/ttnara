import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { OtpProps } from "@/app/api/otp";
import { POST as otpPOST } from "@/app/api/otp";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: OtpProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await otpPOST(json);
  return response.json(result);
};
