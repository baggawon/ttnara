import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as summaryThreadsReadGET } from "@/app/api/summary_threads/read";

export const GET = async (_req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const { result, data } = await summaryThreadsReadGET();

  const nextResponse = response.json({ result, data });
  return nextResponse;
};
