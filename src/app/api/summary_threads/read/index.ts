import {
  tetherInclude,
  tetherPublicSelect,
  type TetherPublicWithProfile,
} from "@/app/api/tethers/read";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import { TetherStatus } from "@/helpers/types";

export interface SummaryThreadsListResponse {
  summaries: TetherPublicWithProfile[];
}

export const GET = async () => {
  try {
    const summaryResult = await handleConnect((prisma) =>
      prisma.tether.findMany({
        where: {
          status: {
            notIn: [TetherStatus.Cancel],
          },
        },
        select: {
          ...tetherPublicSelect,
          ...tetherInclude({ id: 0 }),
        },
        orderBy: { created_at: "desc" },
        take: 6,
      })
    );
    if (!summaryResult) throw ToastData.unknown;

    return { result: true, data: { summaries: summaryResult } };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
