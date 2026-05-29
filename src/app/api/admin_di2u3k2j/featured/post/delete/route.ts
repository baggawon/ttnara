import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as featuredPostDelete } from "@/app/api/admin_di2u3k2j/featured/post/delete";
import type { FeaturedPostDeleteProps } from "@/app/api/admin_di2u3k2j/featured/post/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: FeaturedPostDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await featuredPostDelete(json);
  return response.json(result);
};
