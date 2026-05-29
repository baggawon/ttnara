import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { POST as bulkCreate } from "@/app/api/admin_di2u3k2j/topics/categories/bulk-create";
import type { TopicCategoriesBulkCreateProps } from "@/app/api/admin_di2u3k2j/topics/categories/bulk-create";

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const json: TopicCategoriesBulkCreateProps = await req.json();
  const response = ResponseValues<ApiReturnProps>();
  const result = await bulkCreate(json);
  return response.json(result);
};
