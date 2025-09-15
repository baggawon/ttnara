import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { threadGeneralSettingsUpdateProps } from "@/app/api/admin_di2u3k2j/settings/thread/update";
import { POST as threadGeneralUpdatePOST } from "@/app/api/admin_di2u3k2j/settings/thread/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: threadGeneralSettingsUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await threadGeneralUpdatePOST(json);
  return response.json(result);
};
