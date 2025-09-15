import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { topicsUpdateProps } from "@/app/api/admin_di2u3k2j/topics/update";
import { POST as topicsUpdatePOST } from "@/app/api/admin_di2u3k2j/topics/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: topicsUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await topicsUpdatePOST(json);
  return response.json(result);
};
