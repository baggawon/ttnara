import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { BoardRankCreateProps } from "@/app/api/admin_di2u3k2j/board_ranks/create";
import { POST as boardRanksCreatePOST } from "@/app/api/admin_di2u3k2j/board_ranks/create";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: BoardRankCreateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await boardRanksCreatePOST(json);
  return response.json(result);
};
