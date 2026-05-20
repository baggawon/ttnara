import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface SupportQnaCategoryCreateProps {
  name: string;
  display_order?: number;
  is_active?: boolean;
}

export const POST = async (json: SupportQnaCategoryCreateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const name = json.name?.trim();
    if (!name) {
      return {
        result: false,
        message: ToastData.supportQnaCategoryCreateFailed,
      };
    }

    const created = await handleConnect((prisma) =>
      prisma.support_qna_category.create({
        data: {
          name,
          display_order: json.display_order ?? 0,
          is_active: json.is_active ?? true,
        },
      })
    );
    if (!created) throw ToastData.supportQnaCategoryCreateFailed;

    await appCache.refreshCache(CacheKey.Support);

    return { result: true, message: ToastData.supportQnaCategoryCreate };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
