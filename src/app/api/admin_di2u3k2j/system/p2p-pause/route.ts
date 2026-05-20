import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import {
  POST as p2pPausePOST,
  type P2pPauseProps,
} from "@/app/api/admin_di2u3k2j/system/p2p-pause";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: P2pPauseProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await p2pPausePOST(json);
  return response.json(result);
};
