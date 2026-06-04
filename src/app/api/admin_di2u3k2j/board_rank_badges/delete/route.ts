import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as deletePOST } from "@/app/api/admin_di2u3k2j/board_rank_badges/delete";
import type { BoardRankBadgeDeleteProps } from "@/app/api/admin_di2u3k2j/board_rank_badges/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: BoardRankBadgeDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await deletePOST(json);
  return response.json(result);
};
