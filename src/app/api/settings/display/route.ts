import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextResponse } from "next/server";
import { GET as displaySettingsPublicRead } from "@/app/api/settings/display";

export const GET = async (): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const result = await displaySettingsPublicRead();
  return response.json(result);
};
