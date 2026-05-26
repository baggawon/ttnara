import type { guarantee_region } from "@prisma/client";
import { handleConnect } from "@/helpers/server/prisma";
import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";

export interface GuaranteeRegionListResponse {
  guaranteeRegions: guarantee_region[];
}

export interface GuaranteeRegionReadProps {}

async function getGuaranteeRegions(): Promise<GuaranteeRegionListResponse> {
  const guaranteeRegions = await handleConnect((prisma) =>
    prisma.guarantee_region.findMany({
      orderBy: [{ display_order: "asc" }, { id: "asc" }],
    })
  );
  if (!guaranteeRegions) throw ToastData.unknown;

  return { guaranteeRegions };
}

export async function GET(queryParams: any) {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    const response = await getGuaranteeRegions();
    return {
      result: true,
      data: response,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
}
