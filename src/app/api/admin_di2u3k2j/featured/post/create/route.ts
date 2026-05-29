import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as featuredPostCreate } from "@/app/api/admin_di2u3k2j/featured/post/create";
import type { FeaturedPostCreateProps } from "@/app/api/admin_di2u3k2j/featured/post/create";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: FeaturedPostCreateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await featuredPostCreate(json);
  return response.json(result);
};
