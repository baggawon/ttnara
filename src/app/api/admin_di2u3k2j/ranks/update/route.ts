import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { RanksUpdateProps } from "@/app/api/admin_di2u3k2j/ranks/update";
import { POST as ranksUpdatePOST } from "@/app/api/admin_di2u3k2j/ranks/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: RanksUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await ranksUpdatePOST(json);
  return response.json(result);
};
