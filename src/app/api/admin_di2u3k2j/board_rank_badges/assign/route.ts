import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as assignPOST } from "@/app/api/admin_di2u3k2j/board_rank_badges/assign";
import type { BoardRankBadgeAssignProps } from "@/app/api/admin_di2u3k2j/board_rank_badges/assign";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: BoardRankBadgeAssignProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await assignPOST(json);
  return response.json(result);
};
