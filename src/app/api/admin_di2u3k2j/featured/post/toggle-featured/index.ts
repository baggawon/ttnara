import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { getSpecialTopic } from "@/helpers/server/specialBoard";

export interface FeaturedPostToggleProps {
  id: number;
  // When provided, sets is_featured to this value (idempotent); otherwise
  // flips the current value. Idempotent calls are friendlier to the
  // optimistic-UI pattern on the client.
  is_featured?: boolean;
}

export interface FeaturedPostToggleResult {
  id: number;
  is_featured: boolean;
}

export const POST = async (json: FeaturedPostToggleProps) => {
  try {
    if (typeof json?.id !== "number" || json.id <= 0) throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const topic = await getSpecialTopic();
    if (!topic) {
      return {
        result: false,
        message: "메인 홈 카드형 게시판이 지정되어 있지 않습니다.",
      };
    }

    const existing = await handleConnect((prisma) =>
      prisma.thread.findFirst({
        where: { id: json.id, topic_id: topic.id },
        select: { is_featured: true },
      })
    );
    if (!existing) {
      return { result: false, message: "게시글을 찾을 수 없습니다." };
    }

    const nextValue =
      typeof json.is_featured === "boolean"
        ? json.is_featured
        : !existing.is_featured;

    const updated = await handleConnect((prisma) =>
      prisma.thread.update({
        where: { id: json.id },
        data: { is_featured: nextValue },
        select: { id: true, is_featured: true },
      })
    );
    if (!updated) throw ToastData.unknown;

    return {
      result: true,
      data: updated as FeaturedPostToggleResult,
    };
  } catch (error) {
    console.log("featured post toggle error", error);
    return { result: false, message: String(error) };
  }
};
