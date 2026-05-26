import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import type { guarantee_region } from "@prisma/client";

export interface GuaranteeRegionUpdateProps {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
}

export const POST = async (json: GuaranteeRegionUpdateProps) => {
  try {
    if (typeof json?.id !== "number") throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const isCreate = json.id === 0;
    const trimmedName = typeof json.name === "string" ? json.name.trim() : "";

    if (!trimmedName) {
      throw ToastData.guaranteeRegionNameRequired;
    }

    const existing = await handleConnect((prisma) =>
      prisma.guarantee_region.findFirst({
        where: { name: trimmedName },
        select: { id: true, is_active: true },
      })
    );
    if (existing && (isCreate || existing.id !== json.id)) {
      if (existing.is_active === false) {
        throw ToastData.guaranteeRegionDuplicateDeleted;
      }
      throw ToastData.guaranteeRegionDuplicate;
    }

    const display_order =
      typeof json.display_order === "number" && json.display_order >= 1
        ? json.display_order
        : 1;

    const data: Omit<guarantee_region, "id" | "created_at" | "updated_at"> = {
      name: trimmedName,
      display_order,
      is_active: json.is_active ?? true,
    };

    const result = await handleConnect((prisma) =>
      isCreate
        ? prisma.guarantee_region.create({
            data: { ...data, is_active: true },
          })
        : prisma.guarantee_region.update({
            where: { id: json.id },
            data,
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
