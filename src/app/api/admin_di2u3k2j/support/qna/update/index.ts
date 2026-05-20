import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";

export interface SupportQnaUpdateProps {
  id: number;
  category_id: number;
  question: string;
  answer: string;
  content_format?: string;
  display_order?: number;
  is_active?: boolean;
}

export const POST = async (json: SupportQnaUpdateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const id = Number(json.id);
    const category_id = Number(json.category_id);
    const question = json.question?.trim();
    const answer = json.answer ?? "";

    if (
      !Number.isFinite(id) ||
      id <= 0 ||
      !Number.isFinite(category_id) ||
      category_id <= 0 ||
      !question
    ) {
      return { result: false, message: ToastData.supportQnaUpdateFailed };
    }

    const category = await handleConnect((prisma) =>
      prisma.support_qna_category.findUnique({ where: { id: category_id } })
    );
    if (!category) {
      return { result: false, message: ToastData.supportQnaUpdateFailed };
    }

    const updated = await handleConnect((prisma) =>
      prisma.support_qna.update({
        where: { id },
        data: {
          category_id,
          question,
          answer,
          content_format: json.content_format ?? "html",
          display_order: json.display_order ?? 0,
          is_active: json.is_active ?? true,
        },
      })
    );
    if (!updated) throw ToastData.supportQnaUpdateFailed;

    await appCache.refreshCache(CacheKey.Support);

    return { result: true, message: ToastData.supportQnaUpdate };
  } catch (error) {
    return { result: false, message: String(error) };
  }
};
