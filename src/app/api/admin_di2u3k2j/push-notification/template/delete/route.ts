import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as templateDeleteData } from "@/app/api/admin_di2u3k2j/push-notification/template/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await templateDeleteData(json);
  return response.json(result);
};
