import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface PushTemplateDeleteProps {
  ids: number[];
}

export const POST = async (json: PushTemplateDeleteProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    await handleConnect((prisma) =>
      prisma.push_template.deleteMany({
        where: { id: { in: json.ids } },
      })
    );

    return {
      result: true,
      isSuccess: true,
      hasMessage: ToastData.pushTemplateDelete,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      hasMessage: ToastData.pushTemplateDeleteFailed,
      message: String(error),
    };
  }
};
