import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as signupReadGET } from "@/app/api/signup/read";

export const GET = async (_req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const { result, data } = await signupReadGET();

  const nextResponse = response.json({ result, data });
  return nextResponse;
};
