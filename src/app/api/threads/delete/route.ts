import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { threadDeleteProps } from "@/app/api/threads/delete";
import { POST as threadDeletePOST } from "@/app/api/threads/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: threadDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await threadDeletePOST(json);
  return response.json(result);
};
