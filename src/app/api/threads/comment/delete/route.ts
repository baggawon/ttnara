import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { commentDeleteProps } from "@/app/api/threads/comment/delete";
import { POST as commentDeletePOST } from "@/app/api/threads/comment/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: commentDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await commentDeletePOST(json);
  return response.json(result);
};
