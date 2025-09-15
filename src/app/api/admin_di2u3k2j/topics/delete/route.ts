import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { topicsDeleteProps } from "@/app/api/admin_di2u3k2j/topics/delete";
import { POST as topicsDeletePOST } from "@/app/api/admin_di2u3k2j/topics/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: topicsDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await topicsDeletePOST(json);
  return response.json(result);
};
