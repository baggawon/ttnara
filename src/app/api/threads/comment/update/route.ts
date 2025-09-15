import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as commentUpdatePOST } from "@/app/api/threads/comment/update";
import type { CommentUpdateProps } from "@/app/api/threads/comment/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: CommentUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await commentUpdatePOST(json);
  return response.json(result);
};
