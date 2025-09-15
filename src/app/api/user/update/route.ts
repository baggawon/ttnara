import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { UserUpdateProps } from "@/app/api/user/update";
import { POST as userPOST } from "@/app/api/user/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: UserUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await userPOST(json);
  return response.json(result);
};
