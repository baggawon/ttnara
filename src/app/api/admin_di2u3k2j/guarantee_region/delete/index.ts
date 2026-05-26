import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface GuaranteeRegionDeleteProps {
  deleteGuaranteeRegionId: number;
}

export const POST = async (json: GuaranteeRegionDeleteProps) => {
  try {
    if (typeof json?.deleteGuaranteeRegionId !== "number")
      throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const result = await handleConnect((prisma) =>
      prisma.guarantee_region.update({
        where: { id: json.deleteGuaranteeRegionId },
        data: { is_active: false },
      })
    );
    if (!result) throw ToastData.unknown;

    return { result: true };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
