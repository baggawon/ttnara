import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { BoardRankBatchCreateProps } from "./index";
import { POST as boardRanksBatchPOST } from "./index";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: BoardRankBatchCreateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await boardRanksBatchPOST(json);
  return response.json(result);
};
