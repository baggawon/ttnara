import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { userUpdateProps } from "@/app/api/admin_di2u3k2j/settings/user/update";
import { POST as userUpdatePOST } from "@/app/api/admin_di2u3k2j/settings/user/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: userUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await userUpdatePOST(json);
  return response.json(result);
};
