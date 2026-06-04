import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as ranksData } from "@/app/api/admin_di2u3k2j/board_ranks/read";
import { parseQueryParams } from "@/helpers/common";
import type { BoardRanksReadProps } from "@/app/api/admin_di2u3k2j/board_ranks/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: BoardRanksReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await ranksData(queryParams);
  return response.json(result);
};
