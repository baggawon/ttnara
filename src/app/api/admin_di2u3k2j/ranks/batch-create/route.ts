import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { RankBatchCreateProps } from "./index";
import { POST as ranksBatchPOST } from "./index";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: RankBatchCreateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await ranksBatchPOST(json);
  return response.json(result);
};
