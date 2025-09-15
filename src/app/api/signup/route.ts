import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { SignupProps } from "@/app/api/signup";
import { POST as signupPOST } from "@/app/api/signup";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: SignupProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await signupPOST(json);
  return response.json(result);
};
