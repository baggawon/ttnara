import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface SupportQnaCategoryUpdateProps {
  id: number;
  name: string;
  display_order?: number;
  is_active?: boolean;
}

export const POST = async (json: SupportQnaCategoryUpdateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const id = Number(json.id);
    const name = json.name?.trim();
    if (!id || !name) {
      return {
        result: false,
        message: ToastData.supportQnaCategoryUpdateFailed,
      };
    }

    const updated = await handleConnect((prisma) =>
      prisma.support_qna_category.update({
        where: { id },
        data: {
          name,
          display_order: json.display_order ?? 0,
          is_active: json.is_active ?? true,
        },
      })
    );
    if (!updated) throw ToastData.supportQnaCategoryUpdateFailed;

    await appCache.refreshCache(CacheKey.Support);

    return { result: true, message: ToastData.supportQnaCategoryUpdate };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
