import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { adminUserPasswordProps } from "@/app/api/admin_di2u3k2j/user/password";
import { POST as adminUserPasswordPOST } from "@/app/api/admin_di2u3k2j/user/password";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: adminUserPasswordProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await adminUserPasswordPOST(json);
  return response.json(result);
};
