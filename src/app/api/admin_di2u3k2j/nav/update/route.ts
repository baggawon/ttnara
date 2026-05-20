import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import {
  POST as adminNavUpdate,
  type NavMenuUpdateProps,
} from "@/app/api/admin_di2u3k2j/nav/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: NavMenuUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await adminNavUpdate(json);
  return response.json(result);
};
