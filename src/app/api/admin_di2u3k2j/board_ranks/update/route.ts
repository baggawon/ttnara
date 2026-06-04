import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { BoardRanksUpdateProps } from "@/app/api/admin_di2u3k2j/board_ranks/update";
import { POST as boardRanksUpdatePOST } from "@/app/api/admin_di2u3k2j/board_ranks/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: BoardRanksUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await boardRanksUpdatePOST(json);
  return response.json(result);
};
