import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { levelUpdateProps } from "@/app/api/admin_di2u3k2j/settings/level/update";
import { POST as levelUpdatePOST } from "@/app/api/admin_di2u3k2j/settings/level/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: levelUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await levelUpdatePOST(json);
  return response.json(result);
};
