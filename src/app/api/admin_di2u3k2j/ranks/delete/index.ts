import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface RanksDeleteProps {
  deleteRankId: number;
}

export const POST = async (json: RanksDeleteProps) => {
  try {
    if (typeof json?.deleteRankId !== "number") throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const deleteResult = await handleConnect((prisma) =>
      prisma.trade_rank.delete({
        where: {
          id: json.deleteRankId,
        },
      })
    );
    if (!deleteResult) throw ToastData.unknown;

    return {
      result: true,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
