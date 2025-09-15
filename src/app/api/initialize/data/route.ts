import { ResponseValues } from "@/helpers/server/serverResponse";
import type { ApiReturnProps } from "@/helpers/types";
import type { NextRequest, NextResponse } from "next/server";
import { GET as getInitializeData } from "@/app/api/initialize/data/index";

export const GET = async (_req: NextRequest): Promise<NextResponse> => {
  const response = ResponseValues<ApiReturnProps>();

  try {
    const result = await getInitializeData();

    if (result.result) {
      return response.json(result);
    } else {
      throw new Error("Failed to get initialize data");
    }
  } catch (error) {
    console.error("Initialize data error:", error);
    return response.json({
      result: false,
      message: "Failed to fetch initialize data",
    });
  }
};
