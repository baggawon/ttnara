import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { RanksDeleteProps } from "@/app/api/admin_di2u3k2j/ranks/delete";
import { POST as ranksDeletePOST } from "@/app/api/admin_di2u3k2j/ranks/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: RanksDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await ranksDeletePOST(json);
  return response.json(result);
};
