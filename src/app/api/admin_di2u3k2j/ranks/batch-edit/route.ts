import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { RanksBatchEditRequest } from "./index";
import { POST as ranksBatchEditPOST } from "./index";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: RanksBatchEditRequest = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await ranksBatchEditPOST(json);
  return response.json(result);
};
