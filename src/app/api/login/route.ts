import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { LoginProps } from "@/app/api/login";
import { POST as loginPOST } from "@/app/api/login";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: LoginProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await loginPOST(json);
  return response.json(result);
};
