import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { topicCategoriesUpdateProps } from "@/app/api/admin_di2u3k2j/topics/categories/update";
import { POST as topicCategoriesUpdatePOST } from "@/app/api/admin_di2u3k2j/topics/categories/update";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: topicCategoriesUpdateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await topicCategoriesUpdatePOST(json);
  return response.json(result);
};
