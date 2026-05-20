import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextResponse } from "next/server";
import { GET as boardPreviewReadGET } from "@/app/api/board-preview/read";

export const GET = async (): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const result = await boardPreviewReadGET();
  return response.json(result);
};
