import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { usersUpdateProps } from "@/app/api/admin_di2u3k2j/users/update";
import { POST as usersUpdatePOST } from "@/app/api/admin_di2u3k2j/users/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: usersUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await usersUpdatePOST(json);
  return response.json(result);
};
