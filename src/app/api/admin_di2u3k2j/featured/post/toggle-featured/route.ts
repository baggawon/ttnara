import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as featuredPostToggle } from "@/app/api/admin_di2u3k2j/featured/post/toggle-featured";
import type { FeaturedPostToggleProps } from "@/app/api/admin_di2u3k2j/featured/post/toggle-featured";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: FeaturedPostToggleProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await featuredPostToggle(json);
  return response.json(result);
};
