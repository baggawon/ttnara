import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import {
  POST as adminNavDelete,
  type NavMenuDeleteProps,
} from "@/app/api/admin_di2u3k2j/nav/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: NavMenuDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await adminNavDelete(json);
  return response.json(result);
};
