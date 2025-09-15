import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as topicCategoriesData } from "@/app/api/admin_di2u3k2j/topics/categories/read";
import { parseQueryParams } from "@/helpers/common";
import type { TopicCategoriesReadProps } from "@/app/api/admin_di2u3k2j/topics/categories/read";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const queryParams: TopicCategoriesReadProps = parseQueryParams(req);
  const response = ResponseValues<ApiReturnProps>();
  const result = await topicCategoriesData(queryParams);
  return response.json(result);
};
