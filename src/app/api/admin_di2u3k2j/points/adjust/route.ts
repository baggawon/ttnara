import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { pointAdjustProps } from "@/app/api/admin_di2u3k2j/points/adjust";
import { POST as pointAdjustPOST } from "@/app/api/admin_di2u3k2j/points/adjust";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: pointAdjustProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await pointAdjustPOST(json);
  return response.json(result);
};
