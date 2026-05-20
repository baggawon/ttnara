import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextResponse } from "next/server";
import { GET as tetherSettingsPublicRead } from "@/app/api/tether/settings/read";

export const GET = async (): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();
  const result = await tetherSettingsPublicRead();
  return response.json(result);
};
