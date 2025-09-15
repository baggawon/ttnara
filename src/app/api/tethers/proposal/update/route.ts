import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import {
  POST as tethersProposalUpdatePOST,
  type TetherProposalUpdateProps,
} from "@/app/api/tethers/proposal/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: TetherProposalUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await tethersProposalUpdatePOST(json);
  return response.json(result);
};
