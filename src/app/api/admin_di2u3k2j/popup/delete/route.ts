import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as popupDeleteData } from "@/app/api/admin_di2u3k2j/popup/delete";
import type { PopupDeleteProps } from "@/app/api/admin_di2u3k2j/popup/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const jsonData: PopupDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await popupDeleteData(jsonData);
  return response.json(result);
};
