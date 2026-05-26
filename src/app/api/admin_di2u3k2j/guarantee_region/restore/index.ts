import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface GuaranteeRegionRestoreProps {
  restoreGuaranteeRegionId: number;
}

export const POST = async (json: GuaranteeRegionRestoreProps) => {
  try {
    if (typeof json?.restoreGuaranteeRegionId !== "number")
      throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const target = await handleConnect((prisma) =>
      prisma.guarantee_region.findUnique({
        where: { id: json.restoreGuaranteeRegionId },
        select: { id: true, name: true },
      })
    );
    if (!target) throw ToastData.unknown;

    const conflict = await handleConnect((prisma) =>
      prisma.guarantee_region.findFirst({
        where: {
          name: target.name,
          is_active: true,
          NOT: { id: target.id },
        },
        select: { id: true },
      })
    );
    if (conflict) throw ToastData.guaranteeRegionRestoreConflict;

    const result = await handleConnect((prisma) =>
      prisma.guarantee_region.update({
        where: { id: target.id },
        data: { is_active: true },
      })
    );
    if (!result) throw ToastData.unknown;

    return {
      result: true,
      message: ToastData.guaranteeRegionRestore,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
