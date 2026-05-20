import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface SupportQnaDeleteProps {
  ids: number[];
}

export const POST = async (json: SupportQnaDeleteProps) => {
  try {
    if (!json?.ids || !Array.isArray(json.ids) || json.ids.length === 0) {
      return { result: false, message: ToastData.supportQnaDeleteFailed };
    }

    await requestValidator([RequestValidator.Admin], json);

    const deleted = await handleConnect((prisma) =>
      prisma.support_qna.deleteMany({ where: { id: { in: json.ids } } })
    );
    if (!deleted) throw ToastData.supportQnaDeleteFailed;

    await appCache.refreshCache(CacheKey.Support);

    return { result: true, message: ToastData.supportQnaDelete };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
