import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { EvaluateRankProps } from "@/app/api/ranks/evaluate";
import { POST as evaluateRankPOST } from "@/app/api/ranks/evaluate";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: EvaluateRankProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await evaluateRankPOST(json);
  return response.json(result);
};
