import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { RankCreateProps } from "@/app/api/admin_di2u3k2j/ranks/create";
import { POST as ranksCreatePOST } from "@/app/api/admin_di2u3k2j/ranks/create";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: RankCreateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await ranksCreatePOST(json);
  return response.json(result);
};
