import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as featuredPostUpdate } from "@/app/api/admin_di2u3k2j/featured/post/update";
import type { FeaturedPostUpdateProps } from "@/app/api/admin_di2u3k2j/featured/post/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: FeaturedPostUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await featuredPostUpdate(json);
  return response.json(result);
};
