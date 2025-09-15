import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import {
  POST as tethersProposalRateUpdatePOST,
  type TetherProposalRateUpdateProps,
} from "@/app/api/tethers/proposal/rate/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: TetherProposalRateUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await tethersProposalRateUpdatePOST(json);
  return response.json(result);
};
