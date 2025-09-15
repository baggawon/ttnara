import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface topicCategoriesDeleteProps {
  deleteCategoryId: number;
}

export const POST = async (json: topicCategoriesDeleteProps) => {
  try {
    if (typeof json?.deleteCategoryId !== "number") throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const deleteResult = await handleConnect((prisma) =>
      prisma.topic.delete({
        where: {
          id: json.deleteCategoryId,
        },
      })
    );
    if (!deleteResult) throw ToastData.unknown;

    return {
      result: true,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      message: String(error),
    };
  }
};
