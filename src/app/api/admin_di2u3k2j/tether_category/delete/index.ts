import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface TetherCategoryDeleteProps {
  deleteTetherCategoryId: number;
}

export const POST = async (json: TetherCategoryDeleteProps) => {
  try {
    if (typeof json?.deleteTetherCategoryId !== "number")
      throw ToastData.unknown;

    await requestValidator([RequestValidator.Admin], json);

    const deleteResult = await handleConnect((prisma) =>
      prisma.tether_category.deleteMany({
        where: {
          OR: [
            {
              id: json.deleteTetherCategoryId,
            },
            { parent_id: json.deleteTetherCategoryId },
          ],
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
