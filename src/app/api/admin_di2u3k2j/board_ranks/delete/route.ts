import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { BoardRanksDeleteProps } from "@/app/api/admin_di2u3k2j/board_ranks/delete";
import { POST as boardRanksDeletePOST } from "@/app/api/admin_di2u3k2j/board_ranks/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: BoardRanksDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await boardRanksDeletePOST(json);
  return response.json(result);
};
