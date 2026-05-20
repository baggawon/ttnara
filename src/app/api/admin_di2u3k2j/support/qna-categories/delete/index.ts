import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface SupportQnaCategoriesDeleteProps {
  ids: number[];
}

export const POST = async (json: SupportQnaCategoriesDeleteProps) => {
  try {
    if (!json?.ids || !Array.isArray(json.ids) || json.ids.length === 0) {
      return {
        result: false,
        message: ToastData.supportQnaCategoryDeleteFailed,
      };
    }

    await requestValidator([RequestValidator.Admin], json);

    // QnAs cascade-delete via the support_qna.category onDelete: Cascade relation.
    const deleted = await handleConnect((prisma) =>
      prisma.support_qna_category.deleteMany({
        where: { id: { in: json.ids } },
      })
    );
    if (!deleted) throw ToastData.supportQnaCategoryDeleteFailed;

    await appCache.refreshCache(CacheKey.Support);

    return { result: true, message: ToastData.supportQnaCategoryDelete };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
