import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import {
  POST as adminNavReorder,
  type NavMenuReorderProps,
} from "@/app/api/admin_di2u3k2j/nav/reorder";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: NavMenuReorderProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await adminNavReorder(json);
  return response.json(result);
};
