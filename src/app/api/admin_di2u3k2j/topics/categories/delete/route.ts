import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import type { topicCategoriesDeleteProps } from "@/app/api/admin_di2u3k2j/topics/categories/delete";
import { POST as topicCategoriesDeletePOST } from "@/app/api/admin_di2u3k2j/topics/categories/delete";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: topicCategoriesDeleteProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();

  const result = await topicCategoriesDeletePOST(json);
  return response.json(result);
};
