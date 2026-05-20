import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import {
  POST as adminNavCreate,
  type NavMenuCreateProps,
} from "@/app/api/admin_di2u3k2j/nav/create";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: NavMenuCreateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await adminNavCreate(json);
  return response.json(result);
};
