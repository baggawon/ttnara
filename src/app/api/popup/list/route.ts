import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as popupListData } from "@/app/api/popup/list";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const result = await popupListData();
  return response.json(result);
};
